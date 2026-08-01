from __future__ import annotations

import json
import re
import unicodedata
from typing import Annotated, Any, TypedDict

from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.vectorstores import VectorStore
from langgraph.graph import END, START, StateGraph

from .gemma_endpoint import GemmaVertexEndpoint, MediaPart


class AgentState(TypedDict, total=False):
    question: str
    normalized_question: str
    media: list[MediaPart]
    route: dict[str, str]
    retrieved: list[Document]
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
    for token in ("<|turn>model", "<turn|>", "```json", "```"):
        value = value.replace(token, "")
    return value.strip()


def _json_object(value: str) -> dict[str, Any] | None:
    match = re.search(r"\{.*\}", value, flags=re.DOTALL)
    if not match:
        return None
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _fallback_route(question: str) -> dict[str, str]:
    if _unsafe_request(question):
        return {
            "mode": "blocked",
            "journey": "general",
            "retrieval_query": question,
            "reason": "Solicitud potencialmente dañina.",
        }
    if _needs_official_grounding(question):
        return {
            "mode": "rag",
            "journey": "general",
            "retrieval_query": question,
            "reason": "La consulta requiere respaldo oficial verificable.",
        }
    return {
        "mode": "direct",
        "journey": "general",
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
            docs = vector_store.similarity_search(
                query,
                k=top_k,
                filter={
                    "$and": [
                        {"is_official": {"$eq": True}},
                        {"is_synthetic": {"$eq": False}},
                    ]
                },
            )
        except Exception:
            docs = []
        return {"retrieved": docs}

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
                        "realmente exige una regla oficial, dilo expresamente."
                    )
                ),
                HumanMessage(content=question),
            ]
        else:
            context = "\n\n".join(
                (
                    f"CHUNK_ID={doc.metadata.get('chunk_id', '')}\n"
                    f"TÍTULO={doc.metadata.get('document_title_exact', '')}\n"
                    f"LOCALIZADOR={doc.metadata.get('locator', '')}\n"
                    f"{doc.page_content}"
                )
                for doc in state.get("retrieved", [])
            )
            messages = [
                SystemMessage(
                    content=(
                        "Eres Gemma en HablaPE. Responde en español peruano "
                        "claro usando solamente la evidencia recuperada. No "
                        "añadas plazos, facultades, autoridades ni hechos ausentes. "
                        "No necesitas seleccionar ni devolver IDs de citas: el "
                        "backend los adjuntará de forma determinista. Señala la "
                        "incertidumbre cuando la evidencia sea incompleta."
                    )
                ),
                HumanMessage(
                    content=f"CONSULTA:\n{question}\n\nEVIDENCIA:\n{context}"
                ),
            ]
        try:
            explanation = _clean_model_text(_response_text(model.invoke(messages)))
        except Exception as exc:
            return {
                "draft": {
                    "mode": "blocked",
                    "explanation": "Gemma no pudo generar la respuesta.",
                    "generation_error": type(exc).__name__,
                }
            }
        return {"draft": {"mode": mode, "explanation": explanation}}

    def validate(state: AgentState) -> dict[str, Any]:
        draft = state.get("draft", {})
        selected_mode = state.get("route", {}).get("mode", "blocked")
        mode = str(draft.get("mode", "blocked"))
        explanation = str(draft.get("explanation", "")).strip()
        errors: list[str] = []
        docs = state.get("retrieved", [])
        if not explanation:
            errors.append("Gemma no devolvió una explicación utilizable.")
        if selected_mode == "rag" and not docs:
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
            "explanation": explanation
            or "No se pudo producir una respuesta validada.",
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
