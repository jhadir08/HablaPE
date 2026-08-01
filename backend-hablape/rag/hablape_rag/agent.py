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
    if re.search(
        r"(?im)^(?:SYSTEM|HUMAN|CONSULTA|EVIDENCIA)\s*:", value
    ):
        completion = re.split(
            r"(?im)^(?:ASSISTANT|MODEL|OUTPUT|RESPUESTA|"
            r"EXPLICACI[ÓO]N)\s*:\s*",
            value,
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
    decoder = json.JSONDecoder()
    for match in re.finditer(r"\{", value):
        try:
            parsed, _ = decoder.raw_decode(value[match.start() :])
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed
    return None


def _partial_json_explanation(value: str) -> str:
    """Salvage a complete explanation from otherwise truncated JSON."""

    match = re.search(
        r'"explanation"\s*:\s*"((?:\\.|[^"\\])*)"',
        value,
        flags=re.DOTALL,
    )
    if not match:
        return ""
    try:
        return str(json.loads(f'"{match.group(1)}"')).strip()
    except json.JSONDecodeError:
        return ""


_SECTION_PATTERN = re.compile(
    r"(?im)^(EXPLICACI[ÓO]N|PUEDE HACER|NO PUEDE HACER|"
    r"QU[ÉE] PUEDE HACER|QU[ÉE] NO PUEDE HACER|QU[ÉE] HACER|PASOS|"
    r"FRASE(?:S)? [ÚU]TIL(?:ES)?|SIGUIENTE CONSULTA)\s*:\s*"
)


def _section_items(value: str) -> list[str]:
    items = [
        re.sub(r"^(?:[-*•]|\d+[.)])\s*", "", line).strip()
        for line in value.splitlines()
        if line.strip()
    ]
    return [item for item in items if item][:4]


def _sectioned_answer(value: str) -> dict[str, Any] | None:
    matches = list(_SECTION_PATTERN.finditer(value))
    if not matches:
        return None
    sections: dict[str, str] = {}
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(value)
        heading = _fold(match.group(1))
        body = value[match.end() : end].strip()
        if "explicacion" in heading:
            key = "explanation"
        elif "no puede hacer" in heading:
            key = "police_cannot_do"
        elif "puede hacer" in heading:
            key = "police_can_do"
        elif heading in {"que hacer", "pasos"}:
            key = "next_actions"
        elif heading.startswith("frase"):
            key = "suggested_phrases"
        else:
            key = "follow_up_question"
        sections[key] = body
    explanation = sections.get("explanation", "").strip()
    if not explanation:
        return None
    return {
        "explanation": explanation,
        "next_actions": _section_items(sections.get("next_actions", "")),
        "police_can_do": _section_items(sections.get("police_can_do", "")),
        "police_cannot_do": _section_items(
            sections.get("police_cannot_do", "")
        ),
        "suggested_phrases": _section_items(
            sections.get("suggested_phrases", "")
        ),
        "follow_up_question": sections.get("follow_up_question", "").strip(),
    }


_INTERNAL_CONTEXT_PATTERN = re.compile(
    r"(?:CHUNK_ID|T[ÍI]TULO|LOCALIZADOR)\s*=|"
    r"(?:FRAGMENTO OFICIAL\s+\d+|FUENTE\s+\d+|"
    r"EXTRACTO DE FUENTE OFICIAL)\s*:?|"
    r"(?:SYSTEM|HUMAN)\s*:|"
    r"<\|turn>(?:system|user|model)\b|<turn\|>|"
    r"</?(?:EVIDENCIA_\d+|CONSULTA)(?:\s*>|\b)|"
    r"(?:CONSULTA|EVIDENCIA)\s*:\s*\n",
    flags=re.IGNORECASE,
)


def _contains_internal_context(value: str) -> bool:
    return bool(_INTERNAL_CONTEXT_PATTERN.search(value))


def _answer_payload(raw: str) -> dict[str, Any]:
    cleaned = _clean_model_text(raw)
    parsed = _json_object(cleaned)
    if parsed is None:
        sectioned = _sectioned_answer(cleaned)
        if sectioned is not None:
            return sectioned
        if cleaned.startswith(("{", "[")):
            cleaned = _partial_json_explanation(cleaned)
        return {
            "explanation": cleaned,
            "next_actions": [],
            "police_can_do": [],
            "police_cannot_do": [],
            "suggested_phrases": [],
            "follow_up_question": "",
        }

    explanation = str(parsed.get("explanation") or "").strip()
    list_fields = (
        "next_actions",
        "police_can_do",
        "police_cannot_do",
        "suggested_phrases",
    )
    payload: dict[str, Any] = {"explanation": explanation}
    for key in list_fields:
        values = parsed.get(key)
        payload[key] = (
            [str(item).strip() for item in values if str(item).strip()][:4]
            if isinstance(values, list)
            else []
        )
    payload["follow_up_question"] = str(
        parsed.get("follow_up_question") or ""
    ).strip()
    return payload


def _usable_answer(payload: dict[str, Any]) -> bool:
    explanation = str(payload.get("explanation") or "").strip()
    generated_values = [
        str(item)
        for key in (
            "next_actions",
            "police_can_do",
            "police_cannot_do",
            "suggested_phrases",
        )
        for item in (payload.get(key) or [])
    ]
    generated_values.append(str(payload.get("follow_up_question") or ""))
    return bool(explanation) and len(explanation) <= 2000 and not (
        _contains_internal_context(explanation)
        or any(_contains_internal_context(item) for item in generated_values)
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
                        '"police_can_do":[],"police_cannot_do":[],'
                        '"next_actions":["acción opcional"],'
                        '"suggested_phrases":[],'
                        '"follow_up_question":"consulta completa opcional"}. '
                        "Usa listas vacías cuando no corresponda. La explicación "
                        "debe tener como máximo 160 palabras."
                    )
                ),
                HumanMessage(content=question),
            ]
        else:
            retrieved = state.get("retrieved", [])
            context_parts: list[str] = []
            for doc in retrieved[:3]:
                evidence = " ".join(str(doc.page_content).split())[:1200]
                context_parts.append(
                    f"EXTRACTO DE FUENTE OFICIAL\n{evidence}"
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
                        "cuando la evidencia sea incompleta. Analiza cómo se aplica "
                        "la evidencia al relato y ofrece orientación práctica, no "
                        "una copia de los fragmentos. Devuelve solamente "
                        "JSON válido con este contrato: "
                        '{"explanation":"síntesis en lenguaje ciudadano",'
                        '"police_can_do":["facultad sustentada"],'
                        '"police_cannot_do":["límite sustentado"],'
                        '"next_actions":["paso concreto y prudente"],'
                        '"suggested_phrases":["frase respetuosa para usar"],'
                        '"follow_up_question":"consulta completa que el usuario '
                        'podría hacer después"}. Usa listas vacías para lo que no '
                        "esté sustentado. La explicación debe tener como máximo "
                        "180 palabras; máximo 3 elementos por lista. No presentes "
                        "inferencias como si fueran texto de una norma."
                    )
                ),
                HumanMessage(
                    content=(
                        f"CONSULTA CIUDADANA\n{question}\n\n{context}"
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
                logger.warning(
                    "Gemma devolvió una primera respuesta RAG no utilizable; "
                    "se ejecutará un reintento compacto."
                )
                compact_parts = [
                    " ".join(str(doc.page_content).split())[:700]
                    for doc in state.get("retrieved", [])[:2]
                ]
                compact_context = "\n\n".join(
                    f"EXTRACTO DE FUENTE OFICIAL\n{text}"
                    for text in compact_parts
                )
                retry_prompt = (
                    "Responde en español claro usando solo las fuentes incluidas. "
                    "No copies las fuentes, no uses JSON ni etiquetas técnicas. "
                    "Si una conclusión no está respaldada, indícalo. Usa exactamente "
                    "estos encabezados, dejando vacío lo no sustentado:\n"
                    "EXPLICACIÓN:\nPUEDE HACER:\nNO PUEDE HACER:\n"
                    "QUÉ HACER:\nFRASE ÚTIL:\nSIGUIENTE CONSULTA:\n\n"
                    f"PREGUNTA DEL CIUDADANO: {question}\n\n{compact_context}"
                )
                generated = _answer_payload(
                    _response_text(
                        model.invoke([HumanMessage(content=retry_prompt)])
                    )
                )
                if not _usable_answer(generated):
                    logger.warning(
                        "Gemma devolvió una segunda respuesta RAG no utilizable."
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
                "police_can_do": generated["police_can_do"],
                "police_cannot_do": generated["police_cannot_do"],
                "suggested_phrases": generated["suggested_phrases"],
                "follow_up_question": generated["follow_up_question"],
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
        police_can_do = [
            str(item).strip()
            for item in draft.get("police_can_do", [])
            if str(item).strip()
        ][:4]
        police_cannot_do = [
            str(item).strip()
            for item in draft.get("police_cannot_do", [])
            if str(item).strip()
        ][:4]
        suggested_phrases = [
            str(item).strip()
            for item in draft.get("suggested_phrases", [])
            if str(item).strip()
        ][:4]
        follow_up_question = str(
            draft.get("follow_up_question") or ""
        ).strip()
        generated_values = [
            *next_actions,
            *police_can_do,
            *police_cannot_do,
            *suggested_phrases,
            follow_up_question,
        ]
        errors: list[str] = []
        docs = state.get("retrieved", [])
        if not explanation:
            errors.append("Gemma no devolvió una explicación utilizable.")
        if _contains_internal_context(explanation) or any(
            _contains_internal_context(item) for item in generated_values
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
            "police_can_do": police_can_do if not errors else [],
            "police_cannot_do": police_cannot_do if not errors else [],
            "suggested_phrases": suggested_phrases if not errors else [],
            "follow_up_question": follow_up_question if not errors else "",
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
