from __future__ import annotations

import json
import re
from typing import Annotated, Any, TypedDict

from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.vectorstores import VectorStore
from langgraph.graph import END, START, StateGraph

from .gemma_endpoint import GemmaVertexEndpoint


class AgentState(TypedDict, total=False):
    question: str
    journey: str
    retrieved: list[Document]
    draft: dict[str, Any]
    answer: dict[str, Any]
    validation_errors: Annotated[list[str], list.__add__]


def _classify_journey(text: str) -> str:
    folded = text.lower()
    if any(word in folded for word in ("polic", "dni", "identidad", "retención")):
        return "identidad"
    if any(word in folded for word in ("compra", "reclamo", "proveedor", "indecopi")):
        return "consumo"
    return "fuera_de_alcance"


def build_hablape_graph(
    *, vector_store: VectorStore, model: GemmaVertexEndpoint, top_k: int = 6
):
    """Grafo acotado: clasifica, recupera, explica y valida citas.

    No permite que el modelo modifique plazos, autoridades o fuentes. Los
    validadores de negocio del backend siguen siendo la autoridad final.
    """

    def classify(state: AgentState) -> dict[str, Any]:
        return {"journey": _classify_journey(state["question"])}

    def retrieve(state: AgentState) -> dict[str, Any]:
        if state["journey"] == "fuera_de_alcance":
            return {"retrieved": []}
        docs = vector_store.similarity_search(
            state["question"],
            k=top_k,
            filter={
                "$and": [
                    {"journey": {"$eq": state["journey"]}},
                    {"is_official": {"$eq": True}},
                ]
            },
        )
        return {"retrieved": docs}

    def generate(state: AgentState) -> dict[str, Any]:
        if not state.get("retrieved"):
            return {
                "draft": {
                    "explicacion": "Consulta fuera del alcance o sin fuentes recuperadas.",
                    "chunk_ids": [],
                }
            }
        context = "\n\n".join(
            f"CHUNK_ID={doc.metadata['chunk_id']}\n{doc.page_content}"
            for doc in state["retrieved"]
        )
        messages = [
            SystemMessage(
                content=(
                    "Eres el agente explicador de HablaPE. Responde solo con JSON "
                    "válido con claves explicacion y chunk_ids. No agregues reglas, "
                    "plazos ni autoridades ausentes en los chunks. La explicación "
                    "no es asesoría legal y debe ser clara en español peruano."
                )
            ),
            HumanMessage(
                content=f"PREGUNTA:\n{state['question']}\n\nFUENTES:\n{context}"
            ),
        ]
        raw = str(model.invoke(messages).content)
        match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
        try:
            draft = json.loads(match.group(0) if match else raw)
        except (json.JSONDecodeError, AttributeError):
            draft = {"explicacion": "", "chunk_ids": [], "parse_error": True}
        return {"draft": draft}

    def validate(state: AgentState) -> dict[str, Any]:
        allowed = {
            str(doc.metadata.get("chunk_id")) for doc in state.get("retrieved", [])
        }
        cited = set(state.get("draft", {}).get("chunk_ids", []))
        errors: list[str] = []
        if not cited and allowed:
            errors.append("La explicación no citó ningún chunk recuperado.")
        if state.get("draft", {}).get("parse_error"):
            errors.append("Gemma no devolvió el JSON requerido.")
        unknown = cited - allowed
        if unknown:
            errors.append(f"Citas no recuperadas: {sorted(unknown)}")
        if errors:
            answer = {
                "explicacion": "No se pudo validar la explicación generada.",
                "chunk_ids": [],
                "status": "blocked_by_validator",
            }
        else:
            answer = {**state.get("draft", {}), "status": "validated"}
        return {"answer": answer, "validation_errors": errors}

    graph = StateGraph(AgentState)
    graph.add_node("classify", classify)
    graph.add_node("retrieve", retrieve)
    graph.add_node("generate", generate)
    graph.add_node("validate", validate)
    graph.add_edge(START, "classify")
    graph.add_edge("classify", "retrieve")
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", "validate")
    graph.add_edge("validate", END)
    return graph.compile()
