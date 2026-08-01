from __future__ import annotations

import os
from dataclasses import dataclass


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Falta la variable de entorno {name}.")
    return value


@dataclass(frozen=True)
class GcpSettings:
    project_id: str
    location: str
    bucket: str
    drive_folder_id: str
    documentai_location: str
    documentai_processor_id: str
    documentai_processor_version: str | None
    vector_collection_id: str
    source_registry: str
    gemma_endpoint_id: str | None
    gemma_request_schema: str

    @classmethod
    def from_env(cls) -> "GcpSettings":
        return cls(
            project_id=_required("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
            bucket=_required("HABLAPE_GCS_BUCKET"),
            drive_folder_id=_required("HABLAPE_DRIVE_FOLDER_ID"),
            documentai_location=os.getenv("HABLAPE_DOCUMENTAI_LOCATION", "us"),
            documentai_processor_id=_required(
                "HABLAPE_DOCUMENTAI_PROCESSOR_ID"
            ),
            documentai_processor_version=(
                os.getenv("HABLAPE_DOCUMENTAI_PROCESSOR_VERSION", "").strip()
                or None
            ),
            vector_collection_id=os.getenv(
                "HABLAPE_VECTOR_COLLECTION_ID", "hablape-corpus"
            ),
            source_registry=os.getenv(
                "HABLAPE_SOURCE_REGISTRY", "source_registry.json"
            ),
            gemma_endpoint_id=(
                os.getenv("HABLAPE_GEMMA_ENDPOINT_ID", "").strip() or None
            ),
            gemma_request_schema=os.getenv(
                "HABLAPE_GEMMA_REQUEST_SCHEMA", "vllm"
            ),
        )
