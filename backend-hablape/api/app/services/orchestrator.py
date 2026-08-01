from __future__ import annotations

from datetime import date
from uuid import uuid4

from app.config import Settings
from app.schemas import (
    AnswerBlocks,
    ComplaintDraftRequest,
    ComplaintDraftResponse,
    Journey,
    OrientationRequest,
    OrientationResponse,
    ResponseMeta,
    TraceEvent,
    Urgency,
)
from app.services.classifier import Classification, classify
from app.services.corpus import CorpusRepository
from app.services.models import ModelRuntime
from app.services.privacy import inspect_personal_data
from app.services.traces import TraceStore
from app.services.traduccion import traducir, traducir_lista
from app.services.validators import (
    validate_complaint,
    validate_orientation,
)


class DomainError(ValueError):
    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


def _identity_actions(classification: Classification) -> list[str]:
    if classification.urgency == Urgency.URGENT:
        return [
            "Si sigues retenido o temes por tu integridad, comunica tu ubicación a una persona de confianza y busca defensa legal inmediata.",
            "Anota, sin ponerte en riesgo, la hora, el lugar, la dependencia y los datos disponibles de la diligencia.",
            "No firmes un acta con hechos que no reconoces; pide leerla y conservar una copia.",
        ]
    return [
        "Pregunta con calma el motivo del control y la dependencia del agente.",
        "Muestra tu documento o solicita una alternativa razonable para identificarte en el lugar.",
        "Registra hora, lugar y resultado de la diligencia sin interferir con ella.",
    ]


def _consumer_actions(classification: Classification) -> tuple[list[str], str]:
    if classification.journey == Journey.SECTORAL_CONSUMER:
        return (
            [
                "Conserva el contrato, recibo, constancia y comunicaciones.",
                "Presenta primero el reclamo ante el proveedor o empresa regulada.",
                "Confirma la ruta sectorial antes de escalar; esta versión aún no asigna automáticamente el regulador.",
            ],
            "Ruta sectorial pendiente de validación",
        )
    return (
        [
            "Presenta un reclamo con fecha, producto o servicio, problema y solución solicitada.",
            "Guarda la constancia del Libro de Reclamaciones y los comprobantes.",
            "Si no se resuelve, usa Reclama Virtual de Indecopi.",
        ],
        "https://enlinea.indecopi.gob.pe/reclamavirtual/",
    )


class OrientationOrchestrator:
    def __init__(
        self,
        *,
        settings: Settings,
        corpus: CorpusRepository,
        model: ModelRuntime,
        traces: TraceStore,
    ) -> None:
        self._settings = settings
        self._corpus = corpus
        self._model = model
        self._traces = traces

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
        idioma_target = payload.idioma.lower().strip() if payload.idioma else "es"
        
        # Entrada en español para el pipeline
        texto_es = traducir(payload.text, destino="es", origen=idioma_target)
        
        classification = classify(texto_es)
        privacy = inspect_personal_data(payload.text)
        citations = (
            self._corpus.citations_for(classification.journey)
            if classification.journey != Journey.OUT_OF_SCOPE
            else []
        )
        rules = (
            self._corpus.official_rules_for(classification.journey)
            if classification.journey != Journey.OUT_OF_SCOPE
            else []
        )

        facts = [payload.text]
        facts.extend(
            f"{key}: {value}"
            for key, value in payload.confirmed_facts.items()
            if value is not None
        )

        try:
            explanation = self._model.explain(
                journey=classification.journey,
                user_facts=facts,
                approved_rules=rules,
                flags=list(classification.flags),
            )
        except Exception:
            explanation = (
                "No pudimos generar una explicación adicional. La respuesta "
                "queda limitada a las reglas y acciones verificadas."
            )

        if classification.journey == Journey.IDENTITY:
            actions = _identity_actions(classification)
            channel = None
        elif classification.journey in {
            Journey.CONSUMER,
            Journey.SECTORAL_CONSUMER,
        }:
            actions, channel = _consumer_actions(classification)
        else:
            actions = [
                "Reformula la consulta si trata de control de identidad o un reclamo de consumo.",
                "Para otra materia, busca el canal público o profesional competente.",
            ]
            channel = None

        validations = validate_orientation(
            journey=classification.journey,
            citations=citations,
            corpus=self._corpus,
            confirmed_facts=payload.confirmed_facts,
        )

        # Traducción de salida si el idioma no es español
        # La fuente oficial (rules, citations) NUNCA se traduce
        explanation_tr = traducir(explanation, destino=idioma_target, origen="es")
        actions_tr = traducir_lista(actions, destino=idioma_target, origen="es")
        facts_tr = traducir_lista(facts, destino=idioma_target, origen="es")

        response = OrientationResponse(
            request_id=request_id,
            journey=classification.journey,
            urgency=classification.urgency,
            flags=list(classification.flags),
            blocks=AnswerBlocks(
                user_facts=facts_tr,
                official_rules=rules,
                plain_explanation=explanation_tr,
                next_actions=actions_tr,
                channel=channel,
            ),
            sources=citations,
            validations=validations,
            privacy=privacy,
            meta=ResponseMeta(
                api_version=self._settings.api_version,
                corpus_version=self._corpus.version,
                model_provider=self._model.provider_name,
            ),
        )
        self._traces.write(
            TraceEvent(
                request_id=request_id,
                journey=classification.journey.value,
                urgency=classification.urgency.value,
                flags=list(classification.flags),
                validation_passed=all(item.passed for item in validations),
                is_synthetic=payload.is_synthetic,
                channel=payload.channel.value,
                possible_personal_data=privacy.possible_personal_data,
            )
        )
        return response

    def create_complaint_draft(
        self,
        payload: ComplaintDraftRequest,
        request_id: str | None = None,
    ) -> ComplaintDraftResponse:
        if not payload.consent_to_process:
            raise DomainError(
                "consent_required",
                "Debes confirmar el procesamiento de los datos.",
            )
        if not payload.facts_confirmed:
            raise DomainError(
                "facts_not_confirmed",
                "Confirma los hechos antes de generar el borrador.",
            )

        request_id = request_id or str(uuid4())
        citations = self._corpus.citations_for(Journey.CONSUMER)
        validations = validate_complaint(
            facts_confirmed=payload.facts_confirmed,
            citations=citations,
            corpus=self._corpus,
        )
        purchase_date = (
            payload.purchase_date.isoformat()
            if isinstance(payload.purchase_date, date)
            else "[fecha por completar]"
        )
        reference = payload.order_reference or "[referencia por completar]"
        draft = (
            f"Señores {payload.provider}:\n\n"
            f"El {purchase_date} realicé la compra o contratación identificada "
            f"con la referencia {reference}.\n\n"
            f"Problema: {payload.problem}\n\n"
            f"Solicito: {payload.requested_solution}\n\n"
            "Solicito que la respuesta sea comunicada dentro del plazo legal y "
            "que se me entregue una constancia de este reclamo."
        )
        privacy = inspect_personal_data(
            " ".join(
                (
                    payload.provider,
                    payload.order_reference or "",
                    payload.problem,
                    payload.requested_solution,
                )
            )
        )
        return ComplaintDraftResponse(
            request_id=request_id,
            draft=draft,
            sources=citations,
            validations=validations,
            privacy=privacy,
            meta=ResponseMeta(
                api_version=self._settings.api_version,
                corpus_version=self._corpus.version,
                model_provider="deterministic_template",
            ),
        )

