from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace


API_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_ROOT))
os.environ["HABLAPE_ENV"] = "test"

from app.services.speech import (  # noqa: E402
    GoogleSpeechV2Transcriber,
    SpeechTranscriptionError,
)


class FakeMessage:
    def __init__(self, **kwargs) -> None:
        vars(self).update(kwargs)


class FakeSpeechTypes:
    AutoDetectDecodingConfig = FakeMessage
    RecognitionFeatures = FakeMessage
    RecognitionConfig = FakeMessage
    RecognizeRequest = FakeMessage


class FakeSpeechClient:
    def __init__(self, transcript: str = "Un policía me pidió mi DNI.") -> None:
        self.transcript = transcript
        self.request = None

    def recognize(self, *, request):
        self.request = request
        return SimpleNamespace(
            results=[
                SimpleNamespace(
                    alternatives=[
                        SimpleNamespace(
                            transcript=self.transcript,
                            confidence=0.91,
                        )
                    ],
                    language_code="es-US",
                )
            ]
        )


class SpeechTranscriberTests(unittest.TestCase):
    def test_transcribes_web_audio_without_persisting_it(self) -> None:
        client = FakeSpeechClient()
        transcriber = GoogleSpeechV2Transcriber(
            "project-test",
            client=client,
            speech_types=FakeSpeechTypes,
        )

        result = transcriber.transcribe(b"webm-opus-bytes")

        self.assertEqual(result.text, "Un policía me pidió mi DNI.")
        self.assertEqual(result.language_code, "es-US")
        self.assertAlmostEqual(result.confidence or 0, 0.91)
        self.assertEqual(
            client.request.recognizer,
            "projects/project-test/locations/us/recognizers/_",
        )
        self.assertEqual(client.request.content, b"webm-opus-bytes")
        self.assertEqual(client.request.config.model, "chirp_3")
        self.assertEqual(client.request.config.language_codes, ["es-US"])
        self.assertTrue(
            client.request.config.features.enable_automatic_punctuation
        )

    def test_empty_recognition_is_reported_explicitly(self) -> None:
        transcriber = GoogleSpeechV2Transcriber(
            "project-test",
            client=FakeSpeechClient(transcript=""),
            speech_types=FakeSpeechTypes,
        )

        with self.assertRaises(SpeechTranscriptionError) as context:
            transcriber.transcribe(b"silence")

        self.assertEqual(context.exception.code, "empty_transcript")
        self.assertEqual(context.exception.status_code, 422)


if __name__ == "__main__":
    unittest.main()
