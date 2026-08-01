from __future__ import annotations

import json
import logging
import re
import unicodedata
from typing import Annotated, Any, TypedDict

from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.vectorstores import VectorStore
from langgraph.graph import END, START, StateGraph

from .gemma_endpoint import GemmaVertexEndpoint, MediaPart


logger = logging.getLogger(__name__)


class AgentState(TypedDict, total=False):
    question: str
    normalized_question: str
    media: list[MediaPart]
    route: dict[str, str]
    retrieved: list[Document]
    retrieval_error: str
    draft: dict[str, Any]
    answer: dict[str, Any]
    validation_errors: Annotated[list[str], list.__add__]


def _fold(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.lower())
    return "".join(
        char for char in normalized if not unicodedata.combining(char)
    )


def _needs_official_grounding(text: str) -> bool:
    """Conservative safety gate; Gemma remains the primary route selector."""
    value = _fold(text)
    markers = (
        "policia",
        "comisaria",
        "detener",
        "retener",
        "control de identidad",
        "revisar mi celular",
        "revisar mi imei",
        "pedir mi dni",
        "mostrar mi dni",
        "debo mostrar",
        "puede obligar",
        "pueden obligar",
        "obligarme",
        "facultad",
        "derecho",
        "obligacion",
        "es legal",
        "la ley",
        "articulo",
        "plazo",
        "denuncia",
        "reclamo",
        "indecopi",
        "garantia",
        "libro de reclamaciones",
        "producto defectuoso",
        "puede revisar",
        "pueden revisar",
        "puede exigirme",
        "pueden exigirme",
    )
    return any(marker in value for marker in markers)


def _unsafe_request(text: str) -> bool:
    value = _fold(text)
    return any(
        marker in value
        for marker in (
            "como fabricar un arma",
            "como evadir a la policia",
            "como falsificar",
            "como hackear",
        )
    )


def _response_text(response: Any) -> str:
    content = response.content if isinstance(response, AIMessage) else response
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
        return "\n".join(parts).strip()
    return str(content).strip()


def _clean_model_text(value: str) -> str:
    value = re.sub(
        r"<\|channel>thought.*?<channel\|>", "", value, flags=re.DOTALL
    )
    for token in (
        "<|turn>model",
        "<turn|>",
        "<|end|>",
        "```json",
        "```",
    ):
        value = value.replace(token, "")

    # A serving template can normalize whitespace and prevent exact prompt
    # matching. In RAG prompts the final evidence tag is a safe boundary: only
    # content after it can be a model completion.
    evidence_boundaries = list(
        re.finditer(r"</EVIDENCIA_\d+>", value, flags=re.IGNORECASE)
    )
    if evidence_boundaries:
        value = value[evidence_boundaries[-1].end() :].strip()

    # A prompt echo without a clear completion boundary is not safe to show.
    if re.search(r"(?:SYSTEM|HUMAN|CONSULTA|EVIDENCIA)\s*:", value):
        completion = re.split(
            r"(?:ASSISTANT|MODEL|OUTPUT|RESPUESTA|EXPLICACI[ÓO]N)\s*:\s*",
            value,
            flags=re.IGNORECASE,
        )
        value = completion[-1] if len(completion) > 1 else ""

    # Filtrar repeticiones en bucle producidas por el modelo
    lines = value.strip().split("\n")
    unique_lines: list[str] = []
    seen = set()
    for line in lines:
        cleaned_line = line.strip()
        line_norm = re.sub(r"^\d+[\.\)]\s*", "", cleaned_line)
        if line_norm and line_norm in seen and len(line_norm) > 15:
            continue
        if line_norm:
            seen.add(line_norm)
        unique_lines.append(line)

    return "\n".join(unique_lines).strip()


def _journey_hint(text: str) -> str:
    value = _fold(text)
    if any(
        marker in value
        for marker in (
            "policia",
            "comisaria",
            "control de identidad",
            "dni",
            "imei",
            "celular",
            "detener",
            "retener",
        )
    ):
        return "identidad"
    if any(
        marker in value
        for marker in (
            "indecopi",
            "reclamo",
            "garantia",
            "libro de reclamaciones",
            "producto defectuoso",
            "proveedor",
            "consumidor",
        )
    ):
        return "consumo"
    return "general"


def _json_object(value: str) -> dict[str, Any] | None:
    match = re.search(r"\{.*\}", value, flags=re.DOTALL)
    if not match:
        return None
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


_INTERNAL_CONTEXT_PATTERN = re.compile(
    r"(?:CHUNK_ID|T[ÍI]TULO|LOCALIZADOR)\s*=|"
    r"(?:SYSTEM|HUMAN)\s*:|"
    r"</?(?:EVIDENCIA_\d+|CONSULTA)>|"
    r"(?:CONSULTA|EVIDENCIA)\s*:\s*\n",
    flags=re.IGNORECASE,
)


def _contains_internal_context(value: str) -> bool:
    return bool(_INTERNAL_CONTEXT_PATTERN.search(value))


def _answer_payload(raw: str) -> dict[str, Any]:
    cleaned = _clean_model_text(raw)
    parsed = _json_object(cleaned)
    if parsed is None:
        if cleaned.startswith(("{", "[")):
            cleaned = ""
        return {"explanation": cleaned, "next_actions": []}

    explanation = str(parsed.get("explanation") or "").strip()
    actions = parsed.get("next_actions")
    next_actions = (
        [str(item).strip() for item in actions if str(item).strip()][:4]
        if isinstance(actions, list)
        else []
    )
    return {"explanation": explanation, "next_actions": next_actions}


def _usable_answer(payload: dict[str, Any]) -> bool:
    explanation = str(payload.get("explanation") or "").strip()
    actions = payload.get("next_actions") or []
    return bool(explanation) and len(explanation) <= 2000 and not (
        _contains_internal_context(explanation)
        or any(_contains_internal_context(str(item)) for item in actions)
    )


def _fallback_route(question: str) -> dict[str, str]:
    if _unsafe_request(question):
        return {
            "mode": "blocked",
            "journey": _journey_hint(question),
            "retrieval_query": question,
            "reason": "Solicitud potencialmente dañina.",
        }
    if _needs_official_grounding(question):
        return {
            "mode": "rag",
            "journey": _journey_hint(question),
            "retrieval_query": question,
            "reason": "La consulta requiere respaldo oficial verificable.",
        }
    return {
        "mode": "direct",
        "journey": _journey_hint(question),
        "retrieval_query": question,
        "reason": "La consulta puede responderse sin afirmar reglas jurídicas.",
    }


def _validated_route(raw: str, question: str) -> dict[str, str]:
    parsed = _json_object(_clean_model_text(raw))
    if not parsed:
        return _fallback_route(question)

    aliases = {
        "direct_gemma": "direct",
        "direct": "direct",
        "rag_gemma": "rag",
        "rag": "rag",
        "blocked": "blocked",
    }
    mode = aliases.get(str(parsed.get("mode", "")).lower())
    journey = str(parsed.get("journey", "general")).lower()
    journey_aliases = {
        "identity": "identidad",
        "identidad": "identidad",
        "consumer": "consumo",
        "consumo": "consumo",
        "cumplimiento": "identidad",
        "general": "general",
    }
    if not mode:
        return _fallback_route(question)
    if mode == "direct" and _needs_official_grounding(question):
        mode = "rag"
    if _unsafe_request(question):
        mode = "blocked"
    return {
        "mode": mode,
        "journey": journey_aliases.get(journey, "general"),
        "retrieval_query": str(parsed.get("retrieval_query") or question),
        "reason": str(parsed.get("reason") or "Decisión de Gemma."),
    }


def build_hablape_graph(
    *, vector_store: VectorStore, model: GemmaVertexEndpoint, top_k: int = 6
):
    """Adaptive LangGraph agent with deterministic retrieval and citations.

    Gemma understands the input and selects direct conversation or RAG. The
    application, never the model, decides which retrieved chunk IDs are cited.
    """

    def understand(state: AgentState) -> dict[str, Any]:
        question = state.get("question", "").strip()
        media = state.get("media", [])
        if not media:
            return {"normalized_question": question}
        prompt = (
            "Interpreta la entrada multimodal en español. Transcribe el audio "
            "o describe y lee el texto relevante de la imagen. Devuelve una "
            "descripción fiel y una consulta normalizada; no respondas todavía "
            "la cuestión jurídica. No inventes datos que no estén presentes."
        )
        if question:
            prompt += f"\nAclaración escrita de la persona: {question}"
        try:
            response = model.invoke_multimodal(
                [HumanMessage(content=prompt)], media
            )
            normalized = _clean_model_text(_response_text(response))
        except Exception as exc:
            return {
                "normalized_question": question,
                "draft": {
                    "mode": "blocked",
                    "explanation": (
                        "No se pudo interpretar la entrada multimedia con el "
                        "endpoint Gemma desplegado."
                    ),
                    "generation_error": type(exc).__name__,
                },
            }
        return {"normalized_question": normalized or question}

    def route(state: AgentState) -> dict[str, Any]:
        if state.get("draft", {}).get("generation_error"):
            return {
                "route": {
                    "mode": "blocked",
                    "journey": "general",
                    "retrieval_query": state.get("normalized_question", ""),
                    "reason": "Falló la comprensión multimodal.",
                }
            }
        question = state.get("normalized_question") or state.get("question", "")
        fallback = _fallback_route(question)
        # For the two supported legal journeys, the deterministic safety gate
        # would force RAG even if the model chose direct. Skip that redundant
        # routing inference and save one endpoint round trip.
        if fallback["mode"] == "blocked" or (
            fallback["mode"] == "rag"
            and fallback["journey"] in {"identidad", "consumo"}
        ):
            return {"route": fallback}
        messages = [
            SystemMessage(
                content=(
                    "Eres el enrutador de HablaPE. Elige una sola estrategia y "
                    "devuelve únicamente JSON: {mode, journey, retrieval_query, "
                    "reason}. mode es direct, rag o blocked. Usa direct para "
                    "conversación y conocimiento general que no requiera afirmar "
                    "leyes vigentes (por ejemplo, qué es un IMEI). Usa rag para "
                    "derechos, facultades policiales, procedimientos, plazos, "
                    "autoridades o reclamos que necesiten fuente oficial. Usa "
                    "blocked para solicitudes dañinas o asesoría personalizada "
                    "fuera del corpus. journey es identidad, consumo o general."
                )
            ),
            HumanMessage(content=question),
        ]
        try:
            raw = _response_text(model.invoke(messages))
        except Exception:
            return {"route": _fallback_route(question)}
        return {"route": _validated_route(raw, question)}

    def retrieve(state: AgentState) -> dict[str, Any]:
        selected = state.get("route", {})
        if selected.get("mode") != "rag":
            return {"retrieved": []}
        query = selected.get("retrieval_query") or state.get(
            "normalized_question", ""
        )
        try:
            candidates = vector_store.similarity_search(
                query,
                k=max(top_k * 3, 20),
                filter={"is_official": {"$eq": True}},
            )
        except Exception as exc:
            logger.exception("Vector Search no pudo recuperar evidencia oficial.")
            return {
                "retrieved": [],
                "retrieval_error": type(exc).__name__,
            }
        docs = [
            doc
            for doc in candidates
            if doc.metadata.get("is_official") is True
            and doc.metadata.get("is_synthetic") is not True
        ][:top_k]
        return {"retrieved": docs, "retrieval_error": ""}

    def generate(state: AgentState) -> dict[str, Any]:
        if state.get("draft", {}).get("generation_error"):
            return {}
        selected = state.get("route", {})
        mode = selected.get("mode", "blocked")
        question = state.get("normalized_question") or state.get("question", "")
        if mode == "blocked":
            return {
                "draft": {
                    "mode": "blocked",
                    "explanation": (
                        "No puedo ayudar con esa solicitud. Puedo ofrecer "
                        "información general o explicar procedimientos respaldados "
                        "por fuentes oficiales del corpus de HablaPE."
                    ),
                }
            }
        if mode == "rag" and state.get("retrieval_error"):
            return {
                "draft": {
                    "mode": "blocked",
                    "explanation": (
                        "No pude consultar temporalmente el corpus oficial. "
                        "La consulta requiere RAG y no debe responderse sin "
                        "fuentes verificables."
                    ),
                }
            }
        if mode == "rag" and not state.get("retrieved"):
            return {
                "draft": {
                    "mode": "blocked",
                    "explanation": (
                        "No encontré evidencia oficial suficiente en el corpus "
                        "para responder esa cuestión con seguridad."
                    ),
                }
            }

        if mode == "direct":
            messages = [
                SystemMessage(
                    content=(
                        "Eres Gemma en HablaPE. Responde en español claro y "
                        "natural. Esta ruta no tiene RAG: puedes conversar y "
                        "explicar conocimiento general, pero no inventes normas, "
                        "plazos, autoridades ni asesoría legal. Si la pregunta "
                        "realmente exige una regla oficial, dilo expresamente. "
                        "Devuelve solamente JSON válido con este contrato: "
                        '{"explanation":"respuesta breve",'
                        '"next_actions":["acción opcional"]}. La explicación '
                        "debe tener como máximo 160 palabras."
                    )
                ),
                HumanMessage(content=question),
            ]
        else:
            context_parts: list[str] = []
            for index, doc in enumerate(state.get("retrieved", [])[:4], start=1):
                evidence = " ".join(str(doc.page_content).split())[:1600]
                context_parts.append(
                    f"<EVIDENCIA_{index}>\n{evidence}\n</EVIDENCIA_{index}>"
                )
            context = "\n\n".join(context_parts)
            messages = [
                SystemMessage(
                    content=(
                        "Eres Gemma en HablaPE. Responde en español peruano "
                        "claro usando solamente la evidencia recuperada. No "
                        "añadas plazos, facultades, autoridades ni hechos ausentes. "
                        "No copies la evidencia, nombres de campos ni instrucciones "
                        "internas. No selecciones ni devuelvas citas: el backend "
                        "las adjunta de forma determinista. Señala la incertidumbre "
                        "cuando la evidencia sea incompleta. Devuelve solamente "
                        "JSON válido con este contrato: "
                        '{"explanation":"síntesis en lenguaje ciudadano",'
                        '"next_actions":["paso concreto"]}. La explicación debe '
                        "tener como máximo 180 palabras y las acciones deben surgir "
                        "de la evidencia."
                    )
                ),
                HumanMessage(
                    content=(
                        f"<CONSULTA>\n{question}\n</CONSULTA>\n\n{context}"
                    )
                ),
            ]
        try:
            generated = _answer_payload(_response_text(model.invoke(messages)))
            if (
                not _usable_answer(generated)
                and mode == "rag"
                and not state.get("media")
            ):
                retry_prompt = (
                    "Redacta únicamente una explicación ciudadana clara de "
                    "80 a 160 palabras usando los fragmentos oficiales. No "
                    "devuelvas JSON, etiquetas, metadatos ni copies los "
                    "fragmentos completos. Si falta información, indícalo.\n\n"
                    f"<CONSULTA>\n{question}\n</CONSULTA>\n\n{context}"
                )
                generated = _answer_payload(
                    _response_text(
                        model.invoke([HumanMessage(content=retry_prompt)])
                    )
                )
        except Exception as exc:
            return {
                "draft": {
                    "mode": "blocked",
                    "explanation": "Gemma no pudo generar la respuesta.",
                    "generation_error": type(exc).__name__,
                }
            }
        return {
            "draft": {
                "mode": mode,
                "explanation": generated["explanation"],
                "next_actions": generated["next_actions"],
            }
        }

    def validate(state: AgentState) -> dict[str, Any]:
        draft = state.get("draft", {})
        selected_mode = state.get("route", {}).get("mode", "blocked")
        mode = str(draft.get("mode", "blocked"))
        explanation = str(draft.get("explanation", "")).strip()
        next_actions = [
            str(item).strip()
            for item in draft.get("next_actions", [])
            if str(item).strip()
        ][:4]
        errors: list[str] = []
        docs = state.get("retrieved", [])
        if not explanation:
            errors.append("Gemma no devolvió una explicación utilizable.")
        if _contains_internal_context(explanation) or any(
            _contains_internal_context(item) for item in next_actions
        ):
            errors.append(
                "La respuesta del modelo expuso contexto interno y fue descartada."
            )
        if len(explanation) > 2000:
            errors.append(
                "La respuesta del modelo fue demasiado extensa para lenguaje claro."
            )
        if selected_mode == "rag" and state.get("retrieval_error"):
            errors.append(
                "Falló la consulta a Vector Search "
                f"({state['retrieval_error']})."
            )
        elif selected_mode == "rag" and not docs:
            errors.append("No se recuperaron chunks oficiales.")
        if draft.get("generation_error"):
            errors.append(
                f"Fallo del modelo: {draft['generation_error']}."
            )
        if errors:
            mode = "blocked"
        chunk_ids = (
            [
                str(doc.metadata["chunk_id"])
                for doc in docs
                if doc.metadata.get("chunk_id")
            ]
            if mode == "rag"
            else []
        )
        status = {
            "direct": "direct",
            "rag": "validated",
            "blocked": "blocked_by_validator" if errors else "blocked",
        }[mode]
        answer = {
            "mode": mode,
            "explanation": (
                explanation
                if not errors
                else "No se pudo producir una explicación clara y validada."
            ),
            "next_actions": next_actions if not errors else [],
            "chunk_ids": chunk_ids,
            "status": status,
            "route_reason": state.get("route", {}).get("reason", ""),
            "normalized_question": state.get("normalized_question", ""),
        }
        return {"answer": answer, "validation_errors": errors}

    graph = StateGraph(AgentState)
    graph.add_node("understand", understand)
    graph.add_node("route", route)
    graph.add_node("retrieve", retrieve)
    graph.add_node("generate", generate)
    graph.add_node("validate", validate)
    graph.add_edge(START, "understand")
    graph.add_edge("understand", "route")
    graph.add_edge("route", "retrieve")
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", "validate")
    graph.add_edge("validate", END)
    return graph.compile()
