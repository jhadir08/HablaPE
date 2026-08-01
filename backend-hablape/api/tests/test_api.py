from __future__ import annotations

import json
import os
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

os.environ["HABLAPE_ENV"] = "test"
os.environ["HABLAPE_MODEL_PROVIDER"] = "rules"
os.environ["HABLAPE_TRACE_PROVIDER"] = "memory"

from app.main import app  # noqa: E402
from app.services.speech import SpeechTranscript  # noqa: E402


class FakeSpeechTranscriber:
    provider_name = "fake-speech-v2"

    def ready(self) -> bool:
        return True

    def transcribe(self, audio: bytes) -> SpeechTranscript:
        if audio != b"webm-opus-bytes":
            raise AssertionError("El endpoint alteró los bytes de audio.")
        return SpeechTranscript(
            text="Un policía me pidió mi DNI.",
            language_code="es-US",
            model="chirp_3",
            provider=self.provider_name,
            confidence=0.9,
        )


class HablaPEApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client_context = TestClient(app)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client_context.__exit__(None, None, None)

    def test_health_and_capabilities(self) -> None:
        self.assertEqual(self.client.get("/health/live").status_code, 200)
        ready = self.client.get("/health/ready")
        self.assertEqual(ready.status_code, 200)
        self.assertEqual(ready.json()["status"], "ready")

        capabilities = self.client.get("/v1/capabilities").json()
        self.assertEqual(capabilities["text_orientation"]["status"], "ready")
        self.assertEqual(
            capabilities["document_extraction"]["status"], "pending_gcp"
        )

    def test_identity_response_is_grounded_and_traceable(self) -> None:
        response = self.client.post(
            "/v1/orientations",
            json={
                "text": (
                    "Un policía me pidió el DNI y no explicó el motivo. "
                    "No llevaba DNI."
                ),
                "consent_to_process": True,
                "is_synthetic": True,
            },
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["journey"], "identidad")
        self.assertIn("motivo_no_informado", body["flags"])
        self.assertIn("facilidades_identificacion", body["flags"])
        self.assertTrue(body["sources"])
        self.assertTrue(all(item["passed"] for item in body["validations"]))
        self.assertFalse(body["privacy"]["raw_input_persisted"])
        self.assertEqual(body["meta"]["model_provider"], "rules")

    def test_urgent_identity_case(self) -> None:
        response = self.client.post(
            "/v1/orientations",
            json={
                "text": "Me llevaron a la comisaría y llevo cinco horas allí.",
                "consent_to_process": True,
                "is_synthetic": True,
            },
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["urgency"], "urgente")
        self.assertIn("posible_exceso_plazo", body["flags"])

    def test_out_of_scope_never_invents_sources(self) -> None:
        response = self.client.post(
            "/v1/orientations",
            json={
                "text": "Mi empleador no me pagó el sueldo.",
                "consent_to_process": True,
                "is_synthetic": True,
            },
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["journey"], "fuera_de_alcance")
        self.assertEqual(body["sources"], [])
        self.assertFalse(
            next(
                item for item in body["validations"] if item["name"] == "alcance"
            )["passed"]
        )

    def test_possible_personal_data_is_flagged_not_echoed_to_trace(self) -> None:
        response = self.client.post(
            "/v1/orientations",
            json={
                "text": (
                    "Un policía me pidió identificarme. Mi DNI es 12345678 y "
                    "mi correo es persona@example.com."
                ),
                "consent_to_process": True,
                "is_synthetic": True,
            },
        )
        self.assertEqual(response.status_code, 200)
        labels = response.json()["privacy"]["possible_personal_data"]
        self.assertIn("posible_dni", labels)
        self.assertIn("posible_correo", labels)

    def test_consent_is_required(self) -> None:
        response = self.client.post(
            "/v1/orientations",
            json={"text": "Un policía me pidió mi DNI."},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "consent_required")

    def test_audio_is_transcribed_before_orientation(self) -> None:
        original = self.client.app.state.speech_transcriber
        self.client.app.state.speech_transcriber = FakeSpeechTranscriber()
        try:
            response = self.client.post(
                "/v1/transcriptions",
                content=b"webm-opus-bytes",
                headers={
                    "Content-Type": "audio/webm",
                    "X-Consent-To-Process": "true",
                    "X-Audio-Duration-Seconds": "4.2",
                },
            )
        finally:
            self.client.app.state.speech_transcriber = original

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["transcript"], "Un policía me pidió mi DNI.")
        self.assertEqual(body["provider"], "fake-speech-v2")
        self.assertEqual(body["duration_seconds"], 4.2)
        self.assertFalse(body["raw_audio_persisted"])

    def test_complaint_draft_requires_confirmed_facts(self) -> None:
        base = {
            "provider": "Tienda Demo S.A.C.",
            "purchase_date": "2026-07-10",
            "order_reference": "DEMO-2048",
            "problem": "Los audífonos dejaron de funcionar al día siguiente.",
            "requested_solution": "Solicito el cambio del producto.",
            "consent_to_process": True,
            "is_synthetic": True,
        }
        rejected = self.client.post("/v1/complaints/draft", json=base)
        self.assertEqual(rejected.status_code, 400)
        self.assertEqual(
            rejected.json()["error"]["code"], "facts_not_confirmed"
        )

        accepted = self.client.post(
            "/v1/complaints/draft",
            json={**base, "facts_confirmed": True},
        )
        self.assertEqual(accepted.status_code, 200)
        self.assertIn("Tienda Demo S.A.C.", accepted.json()["draft"])
        self.assertTrue(accepted.json()["sources"])

    def test_all_synthetic_scenarios_route_as_expected(self) -> None:
        scenarios_path = (
            Path(__file__).resolve().parents[2] / "eval" / "scenarios.jsonl"
        )
        for line in scenarios_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            scenario = json.loads(line)
            with self.subTest(scenario=scenario["id"]):
                response = self.client.post(
                    "/v1/orientations",
                    json={
                        "text": scenario["input"],
                        "consent_to_process": True,
                        "is_synthetic": True,
                    },
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    response.json()["journey"], scenario["expected_route"]
                )
                for flag in scenario["expected_flags"]:
                    self.assertIn(flag, response.json()["flags"])


if __name__ == "__main__":
    unittest.main()
