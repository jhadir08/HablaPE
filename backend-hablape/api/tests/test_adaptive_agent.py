from __future__ import annotations

import os
import sys
import unittest
from dataclasses import dataclass
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
RAG_ROOT = API_ROOT.parent / "rag"
sys.path.insert(0, str(API_ROOT))
sys.path.insert(0, str(RAG_ROOT))

os.environ["HABLAPE_ENV"] = "test"
os.environ["HABLAPE_MODEL_PROVIDER"] = "rules"
os.environ["HABLAPE_TRACE_PROVIDER"] = "memory"

from app.config import Settings  # noqa: E402
from app.schemas import OrientationRequest  # noqa: E402
from app.services.adaptive_agent import (  # noqa: E402
    AdaptiveOrientationOrchestrator,
)
from app.services.corpus import CorpusRepository  # noqa: E402
from app.services.traces import MemoryTraceStore  # noqa: E402
from app.services.traduccion import TranslationResult  # noqa: E402


@dataclass
class FakeDocument:
    page_content: str
    metadata: dict[str, object]


class FakeGraph:
    def __init__(self, result: dict) -> None:
        self.result = result
        self.payload: dict | None = None

    def invoke(self, payload: dict) -> dict:
        self.payload = payload
        return self.result


class FakeTranslator:
    def translate(self, text, *, target, source=None):
        if target.value == "es":
            return TranslationResult(
                "¿La policía puede revisar mi IMEI?",
                success=True,
                changed=True,
            )
        return TranslationResult(text, success=True)

    def translate_many(self, texts, *, target, source=None):
        return [
            TranslationResult(f"EN: {text}", success=True, changed=True)
            for text in texts
        ]


class AdaptiveOrchestratorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = Settings.from_env()
        self.corpus = CorpusRepository(
            self.settings.corpus_manifest_path,
            self.settings.corpus_chunks_path,
        )

    def test_direct_answer_has_no_legal_sources(self) -> None:
        graph = FakeGraph(
            {
                "route": {
                    "mode": "direct",
                    "journey": "general",
                    "reason": "Definición general.",
                },
                "retrieved": [],
                "answer": {
                    "mode": "direct",
                    "explanation": "El IMEI identifica un equipo móvil.",
                    "normalized_question": "¿Qué es el IMEI?",
                },
                "validation_errors": [],
            }
        )
        orchestrator = AdaptiveOrientationOrchestrator(
            settings=self.settings,
            corpus=self.corpus,
            traces=MemoryTraceStore(),
            graph=graph,
        )

        response = orchestrator.orient(
            OrientationRequest(
                text="¿Qué es el IMEI?", consent_to_process=True
            )
        )

        self.assertEqual(response.answer_mode.value, "direct_gemma")
        self.assertEqual(response.journey.value, "general")
        self.assertEqual(response.sources, [])

    def test_police_query_is_not_labeled_as_general_when_route_is_imprecise(
        self,
    ) -> None:
        graph = FakeGraph(
            {
                "route": {
                    "mode": "rag",
                    "journey": "general",
                    "reason": "Requiere evidencia oficial.",
                },
                "retrieved": [],
                "answer": {
                    "mode": "blocked",
                    "explanation": "No se recuperó evidencia suficiente.",
                    "normalized_question": (
                        "La policía detuvo a un ciudadano extranjero con CPP."
                    ),
                },
                "validation_errors": ["No se recuperaron chunks oficiales."],
            }
        )
        orchestrator = AdaptiveOrientationOrchestrator(
            settings=self.settings,
            corpus=self.corpus,
            traces=MemoryTraceStore(),
            graph=graph,
        )

        response = orchestrator.orient(
            OrientationRequest(
                text="La policía dice que mi CPP no vale.",
                consent_to_process=True,
            )
        )

        self.assertEqual(response.journey.value, "identidad")

    def test_rag_sources_come_from_retrieved_documents(self) -> None:
        document = FakeDocument(
            page_content="Texto oficial recuperado.",
            metadata={
                "chunk_id": "chk-real",
                "document_id": "doc-real",
                "document_title_exact": "Documento oficial",
                "locator": "Artículo 1",
                "source_url": "https://www.gob.pe/institucion/mininter/normas-legales/1",
                "review_status": "requires_human_legal_review",
            },
        )
        graph = FakeGraph(
            {
                "route": {
                    "mode": "rag",
                    "journey": "identidad",
                    "reason": "Requiere evidencia oficial.",
                },
                "retrieved": [document],
                "answer": {
                    "mode": "rag",
                    "explanation": "Respuesta limitada a la evidencia.",
                    "evidence_summary": [
                        "La Policía puede solicitar una identificación."
                    ],
                    "police_can_do": ["Solicitar la identificación."],
                    "police_cannot_do": ["Exceder el alcance informado."],
                    "next_actions": ["Pregunta el motivo del control."],
                    "suggested_phrases": ["¿Podría explicarme el motivo?"],
                    "follow_up_question": (
                        "¿Qué hago si no me informan el motivo del control?"
                    ),
                    "chunk_ids": ["chk-real"],
                    "normalized_question": "¿La policía puede revisar mi IMEI?",
                },
                "validation_errors": [],
            }
        )
        orchestrator = AdaptiveOrientationOrchestrator(
            settings=self.settings,
            corpus=self.corpus,
            traces=MemoryTraceStore(),
            graph=graph,
        )

        response = orchestrator.orient(
            OrientationRequest(
                text="¿La policía puede revisar mi IMEI?",
                consent_to_process=True,
            )
        )

        self.assertEqual(response.answer_mode.value, "rag_gemma")
        self.assertEqual([item.chunk_id for item in response.sources], ["chk-real"])
        self.assertEqual(
            response.blocks.evidence_summary,
            ["La Policía puede solicitar una identificación."],
        )
        self.assertEqual(
            response.blocks.police_can_do,
            ["Solicitar la identificación."],
        )
        self.assertEqual(
            response.blocks.police_cannot_do,
            ["Exceder el alcance informado."],
        )
        self.assertEqual(
            response.blocks.suggested_phrases,
            ["¿Podría explicarme el motivo?"],
        )
        self.assertTrue(response.blocks.follow_up_question)
        self.assertTrue(
            next(
                item
                for item in response.validations
                if item.name == "citas_deterministicas"
            ).passed
        )

    def test_language_is_normalized_before_rag_and_sources_stay_exact(self) -> None:
        document = FakeDocument(
            page_content="Texto oficial sin traducir.",
            metadata={
                "chunk_id": "chk-language",
                "document_id": "doc-language",
                "document_title_exact": "Norma oficial en español",
                "locator": "Artículo 1",
                "source_url": "https://www.gob.pe/norma",
            },
        )
        graph = FakeGraph(
            {
                "route": {
                    "mode": "rag",
                    "journey": "identidad",
                    "reason": "Requiere fuente oficial.",
                },
                "retrieved": [document],
                "answer": {
                    "mode": "rag",
                    "explanation": "Explicación en español.",
                    "evidence_summary": ["Resumen sencillo."],
                    "normalized_question": "¿La policía puede revisar mi IMEI?",
                },
                "validation_errors": [],
            }
        )
        orchestrator = AdaptiveOrientationOrchestrator(
            settings=self.settings,
            corpus=self.corpus,
            traces=MemoryTraceStore(),
            graph=graph,
            translator=FakeTranslator(),
        )

        response = orchestrator.orient(
            OrientationRequest(
                text="Can the police inspect my IMEI?",
                idioma="en",
                consent_to_process=True,
            )
        )

        self.assertEqual(
            graph.payload["question"],
            "¿La policía puede revisar mi IMEI?",
        )
        self.assertEqual(response.blocks.plain_explanation, "EN: Explicación en español.")
        self.assertEqual(response.blocks.evidence_summary, ["EN: Resumen sencillo."])
        self.assertEqual(response.blocks.official_rules, ["Texto oficial sin traducir."])
        self.assertEqual(response.sources[0].title, "Norma oficial en español")
        self.assertEqual(response.meta.language.value, "en")
        self.assertTrue(response.meta.translation_applied)

    def test_internal_rag_metadata_is_blocked_before_frontend(self) -> None:
        document = FakeDocument(
            page_content="Texto oficial recuperado.",
            metadata={
                "chunk_id": "chk-protected",
                "document_title_exact": "Documento oficial",
                "locator": "Artículo 1",
                "source_url": "https://www.gob.pe/norma",
            },
        )
        graph = FakeGraph(
            {
                "route": {
                    "mode": "rag",
                    "journey": "identidad",
                    "reason": "Requiere fuente oficial.",
                },
                "retrieved": [document],
                "answer": {
                    "mode": "rag",
                    "explanation": (
                        "CHUNK_ID=chk-protected TÍTULO=Documento oficial "
                        "LOCALIZADOR=Artículo 1"
                    ),
                },
                "validation_errors": [],
            }
        )
        orchestrator = AdaptiveOrientationOrchestrator(
            settings=self.settings,
            corpus=self.corpus,
            traces=MemoryTraceStore(),
            graph=graph,
        )

        response = orchestrator.orient(
            OrientationRequest(
                text="¿Qué puede hacer la policía?",
                consent_to_process=True,
            )
        )

        self.assertEqual(response.answer_mode.value, "blocked")
        self.assertNotIn("CHUNK_ID", response.blocks.plain_explanation)
        self.assertEqual(
            [source.chunk_id for source in response.sources],
            ["chk-protected"],
        )
        self.assertFalse(
            next(
                item
                for item in response.validations
                if item.name == "respuesta_modelo"
            ).passed
        )

    def test_truncated_evidence_tag_is_blocked_before_frontend(self) -> None:
        graph = FakeGraph(
            {
                "route": {
                    "mode": "rag",
                    "journey": "identidad",
                    "reason": "Requiere fuente oficial.",
                },
                "retrieved": [],
                "answer": {
                    "mode": "rag",
                    "explanation": "<EVIDENCIA_10",
                },
                "validation_errors": [],
            }
        )
        orchestrator = AdaptiveOrientationOrchestrator(
            settings=self.settings,
            corpus=self.corpus,
            traces=MemoryTraceStore(),
            graph=graph,
        )

        response = orchestrator.orient(
            OrientationRequest(
                text="¿La policía puede pedirme el DNI?",
                consent_to_process=True,
            )
        )

        self.assertEqual(response.answer_mode.value, "blocked")
        self.assertNotIn("EVIDENCIA", response.blocks.plain_explanation)


if __name__ == "__main__":
    unittest.main()
