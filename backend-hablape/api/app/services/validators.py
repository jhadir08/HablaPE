from __future__ import annotations

from app.schemas import (
    Journey,
    SourceCitation,
    ValidationResult,
)
from app.services.corpus import CorpusRepository


def validate_orientation(
    *,
    journey: Journey,
    citations: list[SourceCitation],
    corpus: CorpusRepository,
    confirmed_facts: dict[str, object],
) -> list[ValidationResult]:
    results: list[ValidationResult] = []

    in_scope = journey in {
        Journey.IDENTITY,
        Journey.CONSUMER,
        Journey.SECTORAL_CONSUMER,
    }
    results.append(
        ValidationResult(
            name="alcance",
            passed=in_scope,
            reason=(
                "El escenario pertenece a uno de los dos recorridos MVP."
                if in_scope
                else "El escenario no pertenece a los recorridos MVP."
            ),
        )
    )

    citations_valid = all(
        corpus.has_chunk(citation.chunk_id) for citation in citations
    )
    results.append(
        ValidationResult(
            name="citas",
            passed=citations_valid and (bool(citations) if in_scope else True),
            reason=(
                "Todas las citas existen en la versión activa del corpus."
                if citations_valid and (citations or not in_scope)
                else "Falta una cita válida en el corpus activo."
            ),
        )
    )

    current_only = all(
        citation.source_status != "verified_historical_not_current_alone"
        for citation in citations
    )
    results.append(
        ValidationResult(
            name="vigencia",
            passed=current_only,
            reason=(
                "No se usaron fuentes históricas como regla vigente."
                if current_only
                else "Una fuente histórica requiere reemplazo."
            ),
        )
    )

    facts_bounded = len(confirmed_facts) <= 30
    results.append(
        ValidationResult(
            name="hechos_confirmados",
            passed=facts_bounded,
            reason=(
                "Los hechos confirmados respetan el contrato de entrada."
                if facts_bounded
                else "Se recibieron demasiados hechos confirmados."
            ),
        )
    )
    return results


def validate_complaint(
    *,
    facts_confirmed: bool,
    citations: list[SourceCitation],
    corpus: CorpusRepository,
) -> list[ValidationResult]:
    return [
        ValidationResult(
            name="confirmacion",
            passed=facts_confirmed,
            reason=(
                "La persona confirmó los hechos del borrador."
                if facts_confirmed
                else "No se genera un borrador sin hechos confirmados."
            ),
        ),
        ValidationResult(
            name="citas",
            passed=bool(citations)
            and all(corpus.has_chunk(item.chunk_id) for item in citations),
            reason="Las reglas citadas existen en el corpus activo.",
        ),
    ]

