from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SpeechTranscript:
    text: str
    language_code: str
    model: str
    provider: str = "google-cloud-speech-v2"
    confidence: float | None = None


class SpeechTranscriptionError(RuntimeError):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class UnavailableSpeechTranscriber:
    provider_name = "google-cloud-speech-v2"

    def ready(self) -> bool:
        return False

    def transcribe(self, _audio: bytes) -> SpeechTranscript:
        raise SpeechTranscriptionError(
            "speech_not_configured",
            "Speech-to-Text no está configurado en este entorno.",
            503,
        )


class GoogleSpeechV2Transcriber:
    provider_name = "google-cloud-speech-v2"

    def __init__(
        self,
        project_id: str,
        *,
        location: str = "us",
        model: str = "chirp_3",
        language_codes: tuple[str, ...] = ("es-US",),
        client: Any | None = None,
        speech_types: Any | None = None,
    ) -> None:
        self._project_id = project_id
        self._location = location
        self._model = model
        self._language_codes = language_codes
        self._client = client
        self._speech_types = speech_types

    def ready(self) -> bool:
        return bool(self._project_id and self._language_codes)

    def _runtime(self) -> tuple[Any, Any]:
        if self._client is not None and self._speech_types is not None:
            return self._client, self._speech_types
        try:
            from google.api_core.client_options import ClientOptions
            from google.cloud.speech_v2 import SpeechClient
            from google.cloud.speech_v2.types import cloud_speech
        except (ImportError, ModuleNotFoundError) as exc:
            raise SpeechTranscriptionError(
                "speech_dependency_missing",
                "El runtime de Speech-to-Text no está instalado.",
                503,
            ) from exc

        endpoint = f"{self._location}-speech.googleapis.com"
        self._client = SpeechClient(
            client_options=ClientOptions(api_endpoint=endpoint)
        )
        self._speech_types = cloud_speech
        return self._client, self._speech_types

    def transcribe(self, audio: bytes) -> SpeechTranscript:
        if not audio:
            raise SpeechTranscriptionError(
                "empty_audio", "La grabación está vacía.", 422
            )

        client, speech = self._runtime()
        config = speech.RecognitionConfig(
            auto_decoding_config=speech.AutoDetectDecodingConfig(),
            language_codes=list(self._language_codes),
            model=self._model,
            features=speech.RecognitionFeatures(
                enable_automatic_punctuation=True
            ),
        )
        request = speech.RecognizeRequest(
            recognizer=(
                f"projects/{self._project_id}/locations/{self._location}"
                "/recognizers/_"
            ),
            config=config,
            content=audio,
        )
        try:
            response = client.recognize(request=request)
        except SpeechTranscriptionError:
            raise
        except Exception as exc:  # pragma: no cover - depends on GCP
            logger.exception("Speech-to-Text V2 no pudo transcribir el audio.")
            raise SpeechTranscriptionError(
                "speech_unavailable",
                "No se pudo transcribir el audio temporalmente.",
                503,
            ) from exc

        transcripts: list[str] = []
        confidences: list[float] = []
        detected_language = self._language_codes[0]
        for result in response.results:
            if not result.alternatives:
                continue
            alternative = result.alternatives[0]
            value = str(alternative.transcript).strip()
            if value:
                transcripts.append(value)
            confidence = float(getattr(alternative, "confidence", 0.0) or 0.0)
            if confidence > 0:
                confidences.append(confidence)
            detected_language = (
                str(getattr(result, "language_code", "") or detected_language)
            )

        text = " ".join(transcripts).strip()
        if not text:
            raise SpeechTranscriptionError(
                "empty_transcript",
                "No se detectó una voz comprensible en la grabación.",
                422,
            )
        return SpeechTranscript(
            text=text,
            language_code=detected_language,
            model=self._model,
            confidence=(
                sum(confidences) / len(confidences) if confidences else None
            ),
        )


def build_speech_transcriber(settings: Any) -> Any:
    if not settings.google_cloud_project:
        return UnavailableSpeechTranscriber()
    return GoogleSpeechV2Transcriber(
        settings.google_cloud_project,
        location=settings.speech_location,
        model=settings.speech_model,
        language_codes=settings.speech_language_codes,
    )
