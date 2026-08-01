from __future__ import annotations

import unittest
from unittest.mock import Mock, patch

from pydantic import ValidationError

from app.schemas import OrientationRequest
from app.services import traduccion


class TranslationServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        traduccion._get_translate_client.cache_clear()

    def tearDown(self) -> None:
        traduccion._get_translate_client.cache_clear()

    def test_empty_text_does_not_initialize_client(self) -> None:
        with patch.object(traduccion, "_get_translate_client") as get_client:
            self.assertEqual(traduccion.traducir("", destino="en"), "")
            self.assertEqual(traduccion.traducir(None, destino="en"), "")
            get_client.assert_not_called()

    def test_same_language_returns_original_text(self) -> None:
        with patch.object(traduccion, "_get_translate_client") as get_client:
            result = traduccion.traducir("Consulta legal", destino="ES", origen="es")

        self.assertEqual(result, "Consulta legal")
        get_client.assert_not_called()

    def test_unsupported_language_returns_original_text(self) -> None:
        with patch.object(traduccion, "_get_translate_client") as get_client:
            result = traduccion.traducir("Consulta legal", destino="xx")

        self.assertEqual(result, "Consulta legal")
        get_client.assert_not_called()

    def test_supported_language_uses_google_client(self) -> None:
        client = Mock()
        client.translate.return_value = {"translatedText": "Legal question"}

        with patch.object(traduccion, "_get_translate_client", return_value=client):
            result = traduccion.traducir(
                "Consulta legal", destino="en", origen="es"
            )

        self.assertEqual(result, "Legal question")
        client.translate.assert_called_once_with(
            "Consulta legal",
            target_language="en",
            source_language="es",
            format_="text",
        )

    def test_api_failure_degrades_to_original_text(self) -> None:
        client = Mock()
        client.translate.side_effect = RuntimeError("translation unavailable")

        with patch.object(traduccion, "_get_translate_client", return_value=client):
            result = traduccion.traducir("Consulta legal", destino="qu")

        self.assertEqual(result, "Consulta legal")

    def test_list_translation_preserves_order(self) -> None:
        client = Mock()
        client.translate.side_effect = [
            {"translatedText": "First"},
            {"translatedText": "Second"},
        ]

        with patch.object(traduccion, "_get_translate_client", return_value=client):
            result = traduccion.traducir_lista(
                ["Primero", "Segundo"], destino="en"
            )

        self.assertEqual(result, ["First", "Second"])


class SupportedLanguageSchemaTests(unittest.TestCase):
    def test_supported_languages_are_accepted(self) -> None:
        for language in ("es", "en", "qu", "ay"):
            with self.subTest(language=language):
                payload = OrientationRequest(text="Consulta legal", idioma=language)
                self.assertEqual(payload.idioma, language)

    def test_unsupported_language_is_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            OrientationRequest(text="Consulta legal", idioma="xx")


if __name__ == "__main__":
    unittest.main()
