from __future__ import annotations

from datetime import date, datetime, timezone
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Journey(StrEnum):
    IDENTITY = "identidad"
    CONSUMER = "consumo"
    SECTORAL_CONSUMER = "consumo_sectorial"
    OUT_OF_SCOPE = "fuera_de_alcance"


class Urgency(StrEnum):
    NORMAL = "normal"
    REVIEW_SOON = "revisar_pronto"
    URGENT = "urgente"


class InputChannel(StrEnum):
    TEXT = "text"
    VOICE_TRANSCRIPT = "voice_transcript"
    DOCUMENT_EXTRACT = "document_extract"


class OrientationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    text: str = Field(min_length=4, max_length=4000)
    channel: InputChannel = InputChannel.TEXT
    confirmed_facts: dict[str, str | int | float | bool | None] = Field(
        default_factory=dict
    )
    consent_to_process: bool = False
    is_synthetic: bool = False

    @field_validator("confirmed_facts")
    @classmethod
    def limit_confirmed_facts(
        cls, value: dict[str, str | int | float | bool | None]
    ) -> dict[str, str | int | float | bool | None]:
        if len(value) > 30:
            raise ValueError("Se permiten como máximo 30 hechos confirmados.")
        return value


class ComplaintDraftRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    provider: str = Field(min_length=2, max_length=160)
    purchase_date: date | None = None
    order_reference: str | None = Field(default=None, max_length=100)
    problem: str = Field(min_length=12, max_length=2500)
    requested_solution: str = Field(min_length=5, max_length=500)
    facts_confirmed: bool = False
    consent_to_process: bool = False
    is_synthetic: bool = False


class ValidationResult(BaseModel):
    name: str
    passed: bool
    reason: str


class SourceCitation(BaseModel):
    chunk_id: str
    document_id: str
    title: str
    publisher: str
    locator: str
    official_url: str
    corpus_version: str
    source_status: str


class AnswerBlocks(BaseModel):
    user_facts: list[str]
    official_rules: list[str]
    plain_explanation: str
    next_actions: list[str]
    channel: str | None = None
    draft: str | None = None


class PrivacyNotice(BaseModel):
    possible_personal_data: list[str] = Field(default_factory=list)
    raw_input_persisted: bool = False
    retention: str = "no_persistido"


class ResponseMeta(BaseModel):
    api_version: str
    corpus_version: str
    model_provider: str
    generated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    requires_human_legal_review: bool = True


class OrientationResponse(BaseModel):
    request_id: str
    journey: Journey
    urgency: Urgency
    flags: list[str]
    blocks: AnswerBlocks
    sources: list[SourceCitation]
    validations: list[ValidationResult]
    privacy: PrivacyNotice
    meta: ResponseMeta


class ComplaintDraftResponse(BaseModel):
    request_id: str
    draft: str
    sources: list[SourceCitation]
    validations: list[ValidationResult]
    privacy: PrivacyNotice
    meta: ResponseMeta


class SourceDocument(BaseModel):
    id: str
    journey: str
    title: str
    publisher: str
    official_url: str
    status: str
    relevant_sections: list[str]
    notes: str


class CapabilityStatus(BaseModel):
    status: str
    provider: str | None = None
    detail: str | None = None


class CapabilitiesResponse(BaseModel):
    api_version: str
    environment: str
    journeys: list[str]
    text_orientation: CapabilityStatus
    document_extraction: CapabilityStatus
    speech_to_text: CapabilityStatus
    trace_store: CapabilityStatus
    corpus_version: str


class TraceEvent(BaseModel):
    request_id: str
    journey: str
    urgency: str
    flags: list[str]
    validation_passed: bool
    is_synthetic: bool
    channel: str
    possible_personal_data: list[str]
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class ErrorBody(BaseModel):
    code: str
    message: str
    request_id: str
    details: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody

