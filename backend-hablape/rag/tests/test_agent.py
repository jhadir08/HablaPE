from __future__ import annotations

from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage

from hablape_rag.agent import build_hablape_graph
from hablape_rag.gemma_endpoint import GemmaVertexEndpoint, MediaPart


class FakeModel:
    def __init__(self, responses: list[str], multimodal: str = "") -> None:
        self._responses = iter(responses)
        self._multimodal = multimodal
        self.calls = 0

    def invoke(self, _messages):
        self.calls += 1
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
    assert model.calls == 1


def test_structured_rag_answer_keeps_actions_separate_from_explanation() -> None:
    store = FakeVectorStore([official_document()])
    model = FakeModel(
        [
            (
                '{"explanation":"Puedes pedir que te indiquen el motivo del '
                'control.","police_can_do":["Solicitar identificación."],'
                '"police_cannot_do":["Exceder los límites de la intervención."],'
                '"next_actions":["Pregunta el motivo con calma."],'
                '"suggested_phrases":["¿Podría indicarme el motivo?"],'
                '"follow_up_question":"¿Qué hago si no me explican el motivo?"}'
            ),
        ]
    )
    graph = build_hablape_graph(vector_store=store, model=model, top_k=2)

    result = graph.invoke(
        {
            "question": "¿Qué puedo hacer durante el control de identidad policial?",
            "media": [],
        }
    )

    assert result["answer"]["mode"] == "rag"
    assert result["answer"]["explanation"].startswith("Puedes pedir")
    assert result["answer"]["next_actions"] == [
        "Pregunta el motivo con calma."
    ]
    assert result["answer"]["police_can_do"] == [
        "Solicitar identificación."
    ]
    assert result["answer"]["police_cannot_do"] == [
        "Exceder los límites de la intervención."
    ]
    assert result["answer"]["suggested_phrases"] == [
        "¿Podría indicarme el motivo?"
    ]
    assert result["answer"]["follow_up_question"].startswith("¿Qué hago")


def test_internal_rag_context_is_never_returned_as_an_explanation() -> None:
    store = FakeVectorStore([official_document()])
    model = FakeModel(
        [
            "CHUNK_ID=chk-imei TÍTULO=Norma LOCALIZADOR=Artículo 1 texto crudo",
            "CHUNK_ID=chk-imei TÍTULO=Norma LOCALIZADOR=Artículo 1 texto crudo",
        ]
    )
    graph = build_hablape_graph(vector_store=store, model=model, top_k=2)

    result = graph.invoke(
        {"question": "¿La policía puede revisar mi celular?", "media": []}
    )

    assert result["answer"]["mode"] == "blocked"
    assert "CHUNK_ID" not in result["answer"]["explanation"]
    assert any(
        "contexto interno" in error
        for error in result["validation_errors"]
    )


def test_truncated_evidence_tag_is_never_returned_as_an_explanation() -> None:
    store = FakeVectorStore([official_document()])
    model = FakeModel(["<EVIDENCIA_10", "<EVIDENCIA_10"])
    graph = build_hablape_graph(vector_store=store, model=model, top_k=2)

    result = graph.invoke(
        {"question": "¿La policía puede pedirme el DNI?", "media": []}
    )

    assert result["answer"]["mode"] == "blocked"
    assert "EVIDENCIA" not in result["answer"]["explanation"]
    assert any(
        "contexto interno" in error
        for error in result["validation_errors"]
    )


def test_rag_generation_retries_after_an_invalid_first_completion() -> None:
    store = FakeVectorStore([official_document()])
    model = FakeModel(
        [
            "CHUNK_ID=chk-imei texto interno",
            "Puedes pedir que te expliquen el motivo y alcance de la intervención.",
        ]
    )
    graph = build_hablape_graph(vector_store=store, model=model, top_k=2)

    result = graph.invoke(
        {"question": "¿La policía puede revisar mi celular?", "media": []}
    )

    assert result["answer"]["mode"] == "rag"
    assert result["answer"]["explanation"].startswith("Puedes pedir")


def test_compact_retry_parses_guidance_sections_without_json() -> None:
    store = FakeVectorStore([official_document()])
    model = FakeModel(
        [
            "<EVIDENCIA_10",
            (
                "EXPLICACIÓN: La fuente permite orientar el control, pero no "
                "resuelve todos los detalles del caso.\n"
                "PUEDE HACER:\n- Solicitar la identificación.\n"
                "NO PUEDE HACER:\n- Exceder los límites aplicables.\n"
                "QUÉ HACER:\n- Pregunta con calma el motivo.\n"
                "FRASE ÚTIL:\n- ¿Podría explicarme el motivo del control?\n"
                "SIGUIENTE CONSULTA: ¿Qué hago si no aceptan mi documento?"
            ),
        ]
    )
    graph = build_hablape_graph(vector_store=store, model=model, top_k=2)

    result = graph.invoke(
        {"question": "¿La policía puede pedirme el DNI?", "media": []}
    )

    assert result["answer"]["mode"] == "rag"
    assert result["answer"]["police_can_do"] == [
        "Solicitar la identificación."
    ]
    assert result["answer"]["next_actions"] == [
        "Pregunta con calma el motivo."
    ]
    assert result["answer"]["suggested_phrases"] == [
        "¿Podría explicarme el motivo del control?"
    ]


def test_truncated_json_salvages_a_complete_explanation() -> None:
    store = FakeVectorStore([official_document()])
    model = FakeModel(
        [
            (
                '{"explanation":"La evidencia permite dar una orientación '
                'limitada.","next_actions":["Pregunta el motivo"'
            ),
        ]
    )
    graph = build_hablape_graph(vector_store=store, model=model, top_k=2)

    result = graph.invoke(
        {"question": "¿La policía puede pedirme el DNI?", "media": []}
    )

    assert result["answer"]["mode"] == "rag"
    assert result["answer"]["explanation"] == (
        "La evidencia permite dar una orientación limitada."
    )


def test_transformed_prompt_echo_is_cut_after_the_last_evidence_tag() -> None:
    store = FakeVectorStore([official_document()])
    echoed = (
        "SYSTEM: plantilla transformada\nHUMAN: <CONSULTA>pregunta</CONSULTA>\n"
        "<EVIDENCIA_1>texto interno</EVIDENCIA_1>\n"
        '{"explanation":"Respuesta ciudadana clara.","next_actions":[]}'
    )
    model = FakeModel(
        [
            echoed,
        ]
    )
    graph = build_hablape_graph(vector_store=store, model=model, top_k=2)

    result = graph.invoke(
        {"question": "¿La policía puede revisar mi celular?", "media": []}
    )

    assert result["answer"]["mode"] == "rag"
    assert result["answer"]["explanation"] == "Respuesta ciudadana clara."


def test_rag_post_filters_synthetic_documents_without_compound_filter() -> None:
    synthetic = official_document("chk-synthetic")
    synthetic.metadata["is_synthetic"] = True
    store = FakeVectorStore([synthetic, official_document("chk-official")])
    model = FakeModel(
        [
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

    model = FakeModel([])
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


def test_vertex_adapter_removes_an_echoed_prompt() -> None:
    prompt = "SYSTEM: instrucciones\n\nHUMAN: evidencia interna"
    completion = '{"explanation":"Respuesta clara","next_actions":[]}'

    cleaned = GemmaVertexEndpoint._strip_prompt_echo(
        f"{prompt}\n\nASSISTANT: {completion}",
        prompt,
    )
    cleaned_with_template = GemmaVertexEndpoint._strip_prompt_echo(
        f"plantilla transformada por el servidor\nASSISTANT: {completion}",
        prompt,
    )

    assert cleaned == completion
    assert cleaned_with_template == completion


def test_vertex_prediction_uses_a_bounded_timeout(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class FakePrediction:
        predictions = ["Respuesta breve"]

    class FakeEndpoint:
        def __init__(self, **kwargs):
            captured["endpoint"] = kwargs

        def predict(self, *, instances, timeout):
            captured["instances"] = instances
            captured["timeout"] = timeout
            return FakePrediction()

    monkeypatch.setattr(
        "hablape_rag.gemma_endpoint.aiplatform.Endpoint",
        FakeEndpoint,
    )
    model = GemmaVertexEndpoint(
        project_id="project-test",
        location="us-central1",
        endpoint_id="endpoint-test",
        request_schema="prompt",
        prediction_timeout_seconds=12.5,
    )

    response = model.invoke([HumanMessage(content="Hola")])

    assert response.content == "Respuesta breve"
    assert captured["timeout"] == 12.5
