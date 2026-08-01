from __future__ import annotations

import os
import sys
from pathlib import Path
from types import SimpleNamespace


API_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_ROOT))
os.environ["HABLAPE_ENV"] = "test"

from app.schemas import Language  # noqa: E402
from app.services.traduccion import CloudTranslationService  # noqa: E402


class FakeTranslationClient:
    def __init__(self) -> None:
        self.requests: list[dict] = []

    def translate_text(self, *, request: dict):
        self.requests.append(request)
        return SimpleNamespace(
            translations=[
                SimpleNamespace(translated_text=f"TR:{value}")
                for value in request["contents"]
            ]
        )


def test_cloud_translation_batches_text_and_uses_global_parent() -> None:
    client = FakeTranslationClient()
    service = CloudTranslationService("project-test", client=client)

    results = service.translate_many(
        ["uno", "", "dos"],
        target=Language.QUECHUA,
        source=Language.SPANISH,
    )

    assert [result.text for result in results] == ["TR:uno", "", "TR:dos"]
    assert all(result.success for result in results)
    assert client.requests == [
        {
            "parent": "projects/project-test/locations/global",
            "contents": ["uno", "dos"],
            "mime_type": "text/plain",
            "target_language_code": "qu",
            "source_language_code": "es",
        }
    ]
