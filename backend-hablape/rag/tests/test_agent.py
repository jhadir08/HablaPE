from __future__ import annotations

from langchain_core.documents import Document
from langchain_core.messages import AIMessage

from hablape_rag.agent import build_hablape_graph
from hablape_rag.gemma_endpoint import GemmaVertexEndpoint, MediaPart


class FakeModel:
    def __init__(self, responses: list[str], multimodal: str = "") -> None:
        self._responses = iter(responses)
        self._multimodal = multimodal

    def invoke(self, _messages):
        return AIMessage(content=next(self._responses))

    def invoke_multimodal(self, _messages, _media):
        return AIMessage(content=self._multimodal)


class FakeVectorStore:
    def __init__(self, documents: list[Document]) -> None:
        self.documents = documents
        self.calls: list[dict] = []

    def similarity_search(self, query: str, **kwargs):
        self.calls.append({"query": query, **kwargs})
        return self.documents


def official_document(chunk_id: str = "chk-imei") -> Document:
    return Document(
        page_content="La actuación policial debe respetar los límites establecidos.",
        metadata={
            "chunk_id": chunk_id,
            "document_id": "doc-policial",
            "document_title_exact": "Norma oficial",
            "locator": "Artículo 1",
            "source_url": "https://www.gob.pe/institucion/mininter/normas-legales/1",
            "is_official": True,
            "is_synthetic": False,
        },
    )


def test_general_imei_question_uses_gemma_without_rag() -> None:
    store = FakeVectorStore([official_document()])
    model = FakeModel(
        [
            '{"mode":"direct","journey":"general","retrieval_query":"IMEI","reason":"Definición general"}',
            "El IMEI es un identificador del equipo móvil.",
        ]
    )
    graph = build_hablape_graph(vector_store=store, model=model, top_k=4)

    result = graph.invoke({"question": "¿Qué es el IMEI?", "media": []})

    assert result["answer"]["mode"] == "direct"
    assert result["answer"]["chunk_ids"] == []
    assert store.calls == []


def test_police_imei_question_forces_grounded_rag_and_backend_citations() -> None:
    store = FakeVectorStore([official_document()])
    model = FakeModel(
        [
            # Even if the model under-routes, the legal safety gate requires RAG.
            '{"mode":"direct","journey":"identidad","reason":"general"}',
            "La evidencia recuperada no autoriza a exceder esos límites.",
        ]
    )
    graph = build_hablape_graph(vector_store=store, model=model, top_k=4)

    result = graph.invoke(
        {"question": "¿La policía puede revisar mi IMEI?", "media": []}
    )

    assert result["answer"]["mode"] == "rag"
    assert result["answer"]["chunk_ids"] == ["chk-imei"]
    assert len(store.calls) == 1
    assert store.calls[0]["filter"] == {"is_official": {"$eq": True}}


def test_rag_post_filters_synthetic_documents_without_compound_filter() -> None:
    synthetic = official_document("chk-synthetic")
    synthetic.metadata["is_synthetic"] = True
    store = FakeVectorStore([synthetic, official_document("chk-official")])
    model = FakeModel(
        [
            '{"mode":"rag","journey":"identidad","reason":"regla oficial"}',
            "Respuesta limitada al documento oficial.",
        ]
    )
    graph = build_hablape_graph(vector_store=store, model=model, top_k=2)

    result = graph.invoke(
        {"question": "¿La policía puede revisar mi celular?", "media": []}
    )

    assert result["answer"]["mode"] == "rag"
    assert result["answer"]["chunk_ids"] == ["chk-official"]
    assert store.calls[0]["filter"] == {"is_official": {"$eq": True}}
    assert store.calls[0]["k"] == 20


def test_vector_search_failure_is_reported_instead_of_hidden() -> None:
    class FailingVectorStore:
        def similarity_search(self, _query: str, **_kwargs):
            raise RuntimeError("permission denied")

    model = FakeModel(
        ['{"mode":"rag","journey":"identidad","reason":"regla oficial"}']
    )
    graph = build_hablape_graph(
        vector_store=FailingVectorStore(),
        model=model,
    )

    result = graph.invoke(
        {"question": "¿La policía puede revisar mi celular?", "media": []}
    )

    assert result["answer"]["mode"] == "blocked"
    assert result["retrieval_error"] == "RuntimeError"
    assert any("Vector Search" in item for item in result["validation_errors"])


def test_audio_is_understood_before_agent_routes() -> None:
    store = FakeVectorStore([])
    model = FakeModel(
        [
            '{"mode":"direct","journey":"general","reason":"saludo"}',
            "Hola, ¿en qué puedo ayudarte?",
        ],
        multimodal="La persona saluda y pregunta qué es un IMEI.",
    )
    graph = build_hablape_graph(vector_store=store, model=model)

    result = graph.invoke(
        {
            "question": "",
            "media": [
                MediaPart(
                    kind="audio",
                    mime_type="audio/webm",
                    data_base64="AA==",
                )
            ],
        }
    )

    assert "IMEI" in result["answer"]["normalized_question"]
    assert result["answer"]["mode"] == "direct"


def test_gemma4_media_contract_keeps_prompt_and_binary_separate() -> None:
    model = GemmaVertexEndpoint(
        project_id="project-test",
        location="us-central1",
        endpoint_id="endpoint-test",
        request_schema="prompt",
        media_schema="gemma4",
    )
    media = [
        MediaPart(
            kind="image",
            mime_type="image/png",
            data_base64="AA==",
        )
    ]

    payload = model._media_payload("Describe", media, schema="gemma4")
    prompt = model._add_media_placeholders("Describe", media)

    assert payload["images"][0]["data"] == {"b64": "AA=="}
    assert payload["images"][0]["mime_type"] == "image/png"
    assert "<|image|>" in prompt
