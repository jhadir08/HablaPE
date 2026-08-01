from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Iterable

from app.schemas import Language


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class TranslationResult:
    text: str
    success: bool
    changed: bool = False
    error: str | None = None


class CloudTranslationService:
    """Small Cloud Translation v3 adapter with a safe local fallback."""

    def __init__(
        self,
        project_id: str | None,
        *,
        client: Any | None = None,
    ) -> None:
        self._project_id = project_id
        self._client = client
        self._client_initialized = client is not None

    def _get_client(self) -> Any | None:
        if self._client_initialized:
            return self._client
        self._client_initialized = True
        if not self._project_id:
            logger.warning(
                "Cloud Translation no está configurado: falta GOOGLE_CLOUD_PROJECT."
            )
            return None
        try:
            from google.cloud import translate_v3

            self._client = translate_v3.TranslationServiceClient()
        except (ImportError, ModuleNotFoundError) as exc:
            logger.warning(
                "google-cloud-translate no está instalado; se conserva el texto original: %s",
                exc,
            )
        except Exception as exc:  # pragma: no cover - depends on ADC/network
            logger.warning(
                "No se pudo iniciar Cloud Translation; se conserva el texto original: %s",
                type(exc).__name__,
            )
        return self._client

    def translate_many(
        self,
        texts: Iterable[str],
        *,
        target: Language,
        source: Language | None = None,
    ) -> list[TranslationResult]:
        values = list(texts)
        if not values:
            return []
        if source == target:
            return [TranslationResult(text=value, success=True) for value in values]

        non_empty_indexes = [
            index for index, value in enumerate(values) if value.strip()
        ]
        if not non_empty_indexes:
            return [TranslationResult(text=value, success=True) for value in values]

        client = self._get_client()
        if client is None or not self._project_id:
            return [
                TranslationResult(
                    text=value,
                    success=False,
                    error="translation_client_unavailable",
                )
                if index in non_empty_indexes
                else TranslationResult(text=value, success=True)
                for index, value in enumerate(values)
            ]

        request: dict[str, Any] = {
            "parent": f"projects/{self._project_id}/locations/global",
            "contents": [values[index] for index in non_empty_indexes],
            "mime_type": "text/plain",
            "target_language_code": target.value,
        }
        if source is not None:
            request["source_language_code"] = source.value

        try:
            response = client.translate_text(request=request)
            translated = [item.translated_text for item in response.translations]
            if len(translated) != len(non_empty_indexes):
                raise ValueError("Cloud Translation devolvió un número inesperado de textos.")
        except Exception as exc:  # pragma: no cover - error type varies by client
            logger.error(
                "Cloud Translation falló hacia %s: %s",
                target.value,
                type(exc).__name__,
            )
            return [
                TranslationResult(
                    text=value,
                    success=False,
                    error=type(exc).__name__,
                )
                if index in non_empty_indexes
                else TranslationResult(text=value, success=True)
                for index, value in enumerate(values)
            ]

        by_index = dict(zip(non_empty_indexes, translated, strict=True))
        return [
            TranslationResult(
                text=by_index[index],
                success=True,
                changed=by_index[index] != value,
            )
            if index in by_index
            else TranslationResult(text=value, success=True)
            for index, value in enumerate(values)
        ]

    def translate(
        self,
        text: str,
        *,
        target: Language,
        source: Language | None = None,
    ) -> TranslationResult:
        return self.translate_many([text], target=target, source=source)[0]
