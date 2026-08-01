from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.config import Settings
from app.schemas import (
    AnswerBlocks,
    AnswerMode,
    Journey,
    OrientationRequest,
    OrientationResponse,
    ResponseMeta,
    SourceCitation,
    TraceEvent,
    Urgency,
    ValidationResult,
)
from app.services.classifier import classify
from app.services.corpus import CorpusRepository
from app.services.models import RulesModelRuntime
from app.services.orchestrator import DomainError, OrientationOrchestrator
from app.services.privacy import inspect_personal_data
from app.services.traces import TraceStore


_ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
_ALLOWED_AUDIO_MIME = {
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
}


def _journey(value: str) -> Journey:
    return {
        "identidad": Journey.IDENTITY,
        "consumo": Journey.CONSUMER,
        "general": Journey.GENERAL,
    }.get(value, Journey.GENERAL)


def _publisher(url: str, title: str) -> str:
    folded = f"{url} {title}".lower()
    if "defensoria" in folded:
        return "Defensoría del Pueblo"
    if "elperuano" in folded:
        return "Diario Oficial El Peruano"
    if "congreso" in folded:
        return "Congreso de la República"
    if "gob.pe" in folded:
        return "Estado peruano"
    return "Fuente oficial indexada"


def _citation(doc: Any, corpus_version: str) -> SourceCitation | None:
    metadata = doc.metadata
    chunk_id = str(metadata.get("chunk_id", "")).strip()
    if not chunk_id:
        return None
    title = str(
        metadata.get("document_title_exact")
        or metadata.get("title")
        or "Documento oficial"
    )
    source_url = str(metadata.get("source_url") or metadata.get("gcs_uri") or "")
    return SourceCitation(
        chunk_id=chunk_id,
        document_id=str(metadata.get("document_id") or chunk_id),
        title=title,
        publisher=_publisher(source_url, title),
        locator=str(metadata.get("locator") or "Fragmento recuperado"),
        official_url=source_url,
        corpus_version=corpus_version,
        source_status=str(
            metadata.get("review_status") or "requires_human_legal_review"
        ),
    )


class AdaptiveOrientationOrchestrator(OrientationOrchestrator):
    provider_name = "agent-gemma"

    def __init__(
        self,
        *,
        settings: Settings,
        corpus: CorpusRepository,
        traces: TraceStore,
        graph: Any,
    ) -> None:
        super().__init__(
            settings=settings,
            corpus=corpus,
            model=RulesModelRuntime(),
            traces=traces,
        )
        self._settings = settings
        self._corpus = corpus
        self._traces = traces
        self._graph = graph

    def ready(self) -> bool:
        return True

    def _media(self, payload: OrientationRequest) -> list[Any]:
        if payload.image is None and payload.audio is None:
            return []
        from hablape_rag.gemma_endpoint import MediaPart

        media: list[MediaPart] = []
        if payload.image is not None:
            if payload.image.mime_type not in _ALLOWED_IMAGE_MIME:
                raise DomainError(
                    "unsupported_image",
                    "La imagen debe ser JPEG, PNG o WebP.",
                    415,
                )
            if payload.image.decoded_size() > self._settings.max_image_bytes:
                raise DomainError(
                    "image_too_large",
                    "La imagen supera el tamaño máximo permitido.",
                    413,
                )
            media.append(
                MediaPart(
                    kind="image",
                    mime_type=payload.image.mime_type,
                    data_base64=payload.image.data_base64,
                    file_name=payload.image.file_name,
                )
            )
        if payload.audio is not None:
            if payload.audio.mime_type not in _ALLOWED_AUDIO_MIME:
                raise DomainError(
                    "unsupported_audio",
                    "El audio debe ser WebM, WAV, MP3, MP4 u OGG.",
                    415,
                )
            if payload.audio.decoded_size() > self._settings.max_audio_bytes:
                raise DomainError(
                    "audio_too_large",
                    "El audio supera el tamaño máximo permitido.",
                    413,
                )
            media.append(
                MediaPart(
                    kind="audio",
                    mime_type=payload.audio.mime_type,
                    data_base64=payload.audio.data_base64,
                    file_name=payload.audio.file_name,
                )
            )
        return media

    def orient(
        self, payload: OrientationRequest, request_id: str | None = None
    ) -> OrientationResponse:
        if not payload.consent_to_process:
            raise DomainError(
                "consent_required",
                "Debes confirmar el procesamiento del relato para continuar.",
            )
        if len(payload.text) > self._settings.max_text_chars:
            raise DomainError(
                "text_too_long",
                f"El relato supera {self._settings.max_text_chars} caracteres.",
                413,
            )

        request_id = request_id or str(uuid4())
        result = self._graph.invoke(
            {
                "question": payload.text,
                "media": self._media(payload),
            }
        )
        answer = result.get("answer", {})
        mode = str(answer.get("mode", "blocked"))
        answer_mode = {
            "direct": AnswerMode.DIRECT_GEMMA,
            "rag": AnswerMode.RAG_GEMMA,
        }.get(mode, AnswerMode.BLOCKED)
        route = result.get("route", {})
        journey = _journey(str(route.get("journey", "general")))
        normalized = str(
            answer.get("normalized_question") or payload.text
        ).strip()
        classification = classify(normalized)
        urgency = (
            classification.urgency
            if journey != Journey.GENERAL
            and classification.journey != Journey.OUT_OF_SCOPE
            else Urgency.NORMAL
        )
        flags = (
            list(classification.flags) if journey != Journey.GENERAL else []
        )
        flags.append(f"answer_mode:{answer_mode.value}")

        docs = result.get("retrieved", []) if mode == "rag" else []
        citations = [
            citation
            for citation in (
                _citation(doc, self._corpus.version) for doc in docs
            )
            if citation is not None
        ]
        seen: set[str] = set()
        unique_citations: list[SourceCitation] = []
        for item in citations:
            if item.chunk_id not in seen:
                seen.add(item.chunk_id)
                unique_citations.append(item)
        citations = unique_citations

        rules = [
            " ".join(doc.page_content.split())[:700]
            for doc in docs[:4]
            if doc.page_content.strip()
        ]
        facts: list[str] = []
        if payload.text.strip():
            facts.append(payload.text.strip())
        if payload.image is not None or payload.audio is not None:
            facts.append(f"Interpretación de Gemma: {normalized}")
        facts.extend(
            f"{key}: {value}"
            for key, value in payload.confirmed_facts.items()
            if value is not None
        )

        explanation = str(
            answer.get("explanation")
            or "No se pudo producir una respuesta validada."
        )
        validation_errors = list(result.get("validation_errors", []))
        requested_rag = route.get("mode") == "rag"
        validations = [
            ValidationResult(
                name="ruta_agente",
                passed=answer_mode != AnswerMode.BLOCKED,
                reason=str(route.get("reason") or "Ruta no disponible."),
            ),
            ValidationResult(
                name="respuesta_modelo",
                passed=bool(explanation.strip()) and not validation_errors,
                reason=(
                    "Gemma devolvió una respuesta utilizable."
                    if not validation_errors
                    else " ".join(validation_errors)
                ),
            ),
            ValidationResult(
                name="evidencia_oficial",
                passed=(
                    bool(citations) if requested_rag else not citations
                ),
                reason=(
                    f"Se adjuntaron {len(citations)} chunks recuperados."
                    if citations
                    else (
                        "No se recuperó evidencia oficial suficiente."
                        if requested_rag
                        else "La ruta directa no declara fuentes jurídicas."
                    )
                ),
            ),
            ValidationResult(
                name="citas_deterministicas",
                passed=all(
                    item.chunk_id
                    in {
                        str(doc.metadata.get("chunk_id"))
                        for doc in docs
                    }
                    for item in citations
                ),
                reason=(
                    "Las citas fueron asignadas por el backend desde Vector Search."
                ),
            ),
        ]
        privacy = inspect_personal_data(f"{payload.text} {normalized}")
        response = OrientationResponse(
            request_id=request_id,
            answer_mode=answer_mode,
            journey=journey,
            urgency=urgency,
            flags=list(dict.fromkeys(flags)),
            blocks=AnswerBlocks(
                user_facts=facts,
                official_rules=rules,
                plain_explanation=explanation,
                next_actions=[],
                channel=None,
            ),
            sources=citations,
            validations=validations,
            privacy=privacy,
            meta=ResponseMeta(
                api_version=self._settings.api_version,
                corpus_version=self._corpus.version,
                model_provider=self.provider_name,
                requires_human_legal_review=(
                    answer_mode == AnswerMode.RAG_GEMMA
                ),
            ),
        )
        self._traces.write(
            TraceEvent(
                request_id=request_id,
                journey=journey.value,
                urgency=urgency.value,
                flags=response.flags,
                validation_passed=all(item.passed for item in validations),
                is_synthetic=payload.is_synthetic,
                channel=payload.channel.value,
                possible_personal_data=privacy.possible_personal_data,
            )
        )
        return response


def build_adaptive_orchestrator(
    *, settings: Settings, corpus: CorpusRepository, traces: TraceStore
) -> AdaptiveOrientationOrchestrator:
    if not settings.google_cloud_project:
        raise RuntimeError(
            "GOOGLE_CLOUD_PROJECT es obligatorio para el agente adaptativo."
        )
    if not settings.gemma_endpoint_id:
        raise RuntimeError(
            "HABLAPE_GEMMA_ENDPOINT_ID es obligatorio para el agente adaptativo."
        )

    from hablape_rag.agent import build_hablape_graph
    from hablape_rag.gemma_endpoint import GemmaVertexEndpoint
    from hablape_rag.vector_store import build_vector_store

    store = build_vector_store(
        project_id=settings.google_cloud_project,
        location=settings.google_cloud_location,
        collection_id=settings.vector_collection_id,
    )
    model = GemmaVertexEndpoint(
        project_id=settings.google_cloud_project,
        location=settings.google_cloud_location,
        endpoint_id=settings.gemma_endpoint_id,
        request_schema=settings.gemma_request_schema,
        media_schema=settings.gemma_media_schema,
        temperature=0.1,
        max_output_tokens=1200,
    )
    graph = build_hablape_graph(
        vector_store=store,
        model=model,
        top_k=settings.rag_top_k,
    )
    return AdaptiveOrientationOrchestrator(
        settings=settings,
        corpus=corpus,
        traces=traces,
        graph=graph,
    )
