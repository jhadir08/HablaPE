from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _repo_root() -> Path:
    configured = os.getenv("HABLAPE_REPO_ROOT")
    if configured:
        return Path(configured).resolve()
    return Path(__file__).resolve().parents[2]


def _csv(name: str, default: str = "") -> tuple[str, ...]:
    return tuple(
        item.strip()
        for item in os.getenv(name, default).split(",")
        if item.strip()
    )


@dataclass(frozen=True)
class Settings:
    app_name: str
    environment: str
    api_version: str
    repo_root: Path
    corpus_manifest_path: Path
    corpus_chunks_path: Path
    cors_origins: tuple[str, ...]
    max_text_chars: int
    model_provider: str
    trace_provider: str
    google_cloud_project: str | None
    google_cloud_location: str
    vertex_endpoint: str | None
    firestore_database: str

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @classmethod
    def from_env(cls) -> "Settings":
        repo_root = _repo_root()
        environment = os.getenv("HABLAPE_ENV", "local").lower()
        model_provider = os.getenv("HABLAPE_MODEL_PROVIDER", "rules").lower()
        trace_provider = os.getenv("HABLAPE_TRACE_PROVIDER", "memory").lower()

        if environment not in {"local", "test", "production"}:
            raise ValueError("HABLAPE_ENV debe ser local, test o production.")
        if model_provider not in {"rules", "vertex"}:
            raise ValueError("HABLAPE_MODEL_PROVIDER debe ser rules o vertex.")
        if trace_provider not in {"memory", "firestore"}:
            raise ValueError(
                "HABLAPE_TRACE_PROVIDER debe ser memory o firestore."
            )

        return cls(
            app_name="HablaPE API",
            environment=environment,
            api_version="1.0.0",
            repo_root=repo_root,
            corpus_manifest_path=Path(
                os.getenv(
                    "HABLAPE_CORPUS_MANIFEST",
                    repo_root / "corpus" / "manifest.json",
                )
            ),
            corpus_chunks_path=Path(
                os.getenv(
                    "HABLAPE_CORPUS_CHUNKS",
                    repo_root / "corpus" / "chunks.json",
                )
            ),
            cors_origins=_csv(
                "HABLAPE_CORS_ORIGINS",
                "http://localhost:3000,http://127.0.0.1:3000",
            ),
            max_text_chars=int(os.getenv("HABLAPE_MAX_TEXT_CHARS", "4000")),
            model_provider=model_provider,
            trace_provider=trace_provider,
            google_cloud_project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            google_cloud_location=os.getenv(
                "GOOGLE_CLOUD_LOCATION", "us-central1"
            ),
            vertex_endpoint=os.getenv("HABLAPE_VERTEX_ENDPOINT"),
            firestore_database=os.getenv(
                "HABLAPE_FIRESTORE_DATABASE", "(default)"
            ),
        )
