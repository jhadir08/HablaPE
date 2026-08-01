from __future__ import annotations

import re
from typing import Any
from uuid import uuid4

from app.config import Settings
from app.schemas import (
    AnswerBlocks,
    AnswerMode,
    Journey,
    Language,
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
from app.services.traduccion import CloudTranslationService, TranslationResult


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


_INTERNAL_CONTEXT_PATTERN = re.compile(
    r"(?:CHUNK_ID|T[ÍI]TULO|LOCALIZADOR)\s*=|"
    r"(?:SYSTEM|HUMAN)\s*:|"
    r"</?(?:EVIDENCIA_\d+|CONSULTA)(?:\s*>|\b)",
    flags=re.IGNORECASE,
)


def _contains_internal_context(value: str) -> bool:
    return bool(_INTERNAL_CONTEXT_PATTERN.search(value))


def _official_excerpt(doc: Any) -> str:
    """Build a short display excerpt without exposing ingestion metadata."""

    text = " ".join(str(doc.page_content).split())
    title = str(
        doc.metadata.get("document_title_exact")
        or doc.metadata.get("title")
        or ""
    ).strip()
    if title and text.lower().startswith(title.lower()):
        text = text[len(title) :].lstrip(" .:-")
    text = re.sub(
        r"(?:CHUNK_ID|T[ÍI]TULO|LOCALIZADOR)\s*=\S+",
        " ",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"(?:\b\d{1,4}\b\s+){3,}", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= 420:
        return text
    cutoff = max(
        text.rfind(". ", 220, 420),
        text.rfind("; ", 220, 420),
    )
    return text[: cutoff + 1 if cutoff >= 220 else 417].rstrip() + "…"


class AdaptiveOrientationOrchestrator(OrientationOrchestrator):
    provider_name = "agent-gemma"

    def __init__(
        self,
        *,
        settings: Settings,
        corpus: CorpusRepository,
        traces: TraceStore,
        graph: Any,
        translator: CloudTranslationService | None = None,
    ) -> None:
        super().__init__(
            settings=settings,
            corpus=corpus,
            model=RulesModelRuntime(),
            traces=traces,
            translator=translator,
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
        language = payload.idioma
        input_translation = (
            self._translator.translate(
                payload.text,
                target=Language.SPANISH,
            )
            if language != Language.SPANISH
            else TranslationResult(payload.text, success=True)
        )
        result = self._graph.invoke(
            {
                "question": input_translation.text,
                "media": self._media(payload),
            }
        )
        answer = result.get("answer", {})
        mode = str(answer.get("mode", "blocked"))
        explanation = str(
            answer.get("explanation")
            or "No se pudo producir una respuesta validada."
        ).strip()
        next_actions = [
            str(item).strip()
            for item in answer.get("next_actions", [])
            if str(item).strip()
        ][:4]
        police_can_do = [
            str(item).strip()
            for item in answer.get("police_can_do", [])
            if str(item).strip()
        ][:4]
        police_cannot_do = [
            str(item).strip()
            for item in answer.get("police_cannot_do", [])
            if str(item).strip()
        ][:4]
        suggested_phrases = [
            str(item).strip()
            for item in answer.get("suggested_phrases", [])
            if str(item).strip()
        ][:4]
        follow_up_question = str(
            answer.get("follow_up_question") or ""
        ).strip()
        validation_errors = list(result.get("validation_errors", []))
        generated_values = [
            *next_actions,
            *police_can_do,
            *police_cannot_do,
            *suggested_phrases,
            follow_up_question,
        ]
        leaked_context = _contains_internal_context(explanation) or any(
            _contains_internal_context(item) for item in generated_values
        )
        if leaked_context:
            mode = "blocked"
            explanation = "No se pudo producir una explicación clara y validada."
            next_actions = []
            police_can_do = []
            police_cannot_do = []
            suggested_phrases = []
            follow_up_question = ""
            validation_errors.append(
                "La salida contenía metadatos internos del RAG y fue descartada."
            )
        answer_mode = {
            "direct": AnswerMode.DIRECT_GEMMA,
            "rag": AnswerMode.RAG_GEMMA,
        }.get(mode, AnswerMode.BLOCKED)
        route = result.get("route", {})
        journey = _journey(str(route.get("journey", "general")))
        normalized = str(
            answer.get("normalized_question") or input_translation.text
        ).strip()
        classification = classify(normalized)
        if journey == Journey.GENERAL and classification.journey in {
            Journey.IDENTITY,
            Journey.CONSUMER,
            Journey.SECTORAL_CONSUMER,
        }:
            journey = classification.journey
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
        route_mode = str(route.get("mode", "blocked"))
        requested_rag = route_mode == "rag"
        flags.append(f"route_requested:{route_mode}")

        docs = (
            result.get("retrieved", [])
            if requested_rag and not result.get("retrieval_error")
            else []
        )
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

        rules = list(
            dict.fromkeys(
                excerpt
                for excerpt in (
                    _official_excerpt(doc) for doc in docs[:3]
                )
                if excerpt
            )
        )
        facts: list[str] = []
        if input_translation.text.strip():
            facts.append(input_translation.text.strip())
        if payload.image is not None or payload.audio is not None:
            facts.append(f"Interpretación de Gemma: {normalized}")
        facts.extend(
            f"{key}: {value}"
            for key, value in payload.confirmed_facts.items()
            if value is not None
        )

        has_follow_up = bool(follow_up_question)
        output_values = [
            *facts,
            explanation,
            *police_can_do,
            *police_cannot_do,
            *next_actions,
            *suggested_phrases,
            *([follow_up_question] if has_follow_up else []),
        ]
        output_results = (
            self._translator.translate_many(
                output_values,
                target=language,
                source=Language.SPANISH,
            )
            if language != Language.SPANISH
            else [
                TranslationResult(value, success=True)
                for value in output_values
            ]
        )
        fact_count = len(facts)
        facts = [item.text for item in output_results[:fact_count]]
        if language != Language.SPANISH and payload.text.strip() and facts:
            facts[0] = payload.text.strip()
        cursor = fact_count
        explanation = output_results[cursor].text
        cursor += 1

        def translated_slice(size: int) -> list[str]:
            nonlocal cursor
            values = [item.text for item in output_results[cursor : cursor + size]]
            cursor += size
            return values

        police_can_do = translated_slice(len(police_can_do))
        police_cannot_do = translated_slice(len(police_cannot_do))
        next_actions = translated_slice(len(next_actions))
        suggested_phrases = translated_slice(len(suggested_phrases))
        follow_up_question = (
            output_results[cursor].text if has_follow_up else ""
        )
        translation_ok = input_translation.success and all(
            item.success for item in output_results
        )
        validations = [
            ValidationResult(
                name="ruta_agente",
                passed=route_mode in {"direct", "rag"},
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
        if language != Language.SPANISH:
            validations.append(
                ValidationResult(
                    name="traduccion",
                    passed=translation_ok,
                    reason=(
                        "La consulta se normalizó al español y la respuesta "
                        f"se tradujo a {language.value}; "
                        "los textos de las fuentes se conservaron en español."
                        if translation_ok
                        else (
                            "Cloud Translation no estuvo disponible; se "
                            "conservó el texto sin traducir."
                        )
                    ),
                )
            )
        if language != Language.SPANISH:
            flags.append(f"language:{language.value}")
        if language != Language.SPANISH and not translation_ok:
            flags.append("translation_fallback")
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
                next_actions=next_actions,
                police_can_do=police_can_do,
                police_cannot_do=police_cannot_do,
                suggested_phrases=suggested_phrases,
                follow_up_question=follow_up_question or None,
                channel=None,
            ),
            sources=citations,
            validations=validations,
            privacy=privacy,
            meta=ResponseMeta(
                api_version=self._settings.api_version,
                corpus_version=self._corpus.version,
                model_provider=self.provider_name,
                language=language,
                translation_applied=(
                    language != Language.SPANISH and translation_ok
                ),
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
        max_output_tokens=settings.gemma_max_output_tokens,
        prediction_timeout_seconds=(
            settings.gemma_prediction_timeout_seconds
        ),
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
        translator=CloudTranslationService(settings.google_cloud_project),
    )
