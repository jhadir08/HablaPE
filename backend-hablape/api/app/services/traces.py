from __future__ import annotations

import logging
from collections import deque
from typing import Protocol

from app.config import Settings
from app.schemas import TraceEvent


logger = logging.getLogger("hablape.trace")


class TraceStore(Protocol):
    provider_name: str

    def write(self, event: TraceEvent) -> None: ...

    def ready(self) -> bool: ...


class MemoryTraceStore:
    provider_name = "memory"

    def __init__(self, max_events: int = 500) -> None:
        self._events: deque[TraceEvent] = deque(maxlen=max_events)

    def write(self, event: TraceEvent) -> None:
        self._events.append(event)
        logger.info(
            "orientation_completed",
            extra={
                "request_id": event.request_id,
                "journey": event.journey,
                "urgency": event.urgency,
                "flags": event.flags,
                "validation_passed": event.validation_passed,
                "is_synthetic": event.is_synthetic,
                "channel": event.channel,
                "possible_personal_data": event.possible_personal_data,
            },
        )

    def ready(self) -> bool:
        return True


class FirestoreTraceStore:
    provider_name = "firestore"

    def __init__(self, settings: Settings) -> None:
        try:
            from google.cloud import firestore
        except ImportError as exc:
            raise RuntimeError(
                "Instala api/requirements-gcp.txt para usar Firestore."
            ) from exc

        self._client = firestore.Client(
            project=settings.google_cloud_project,
            database=settings.firestore_database,
        )

    def write(self, event: TraceEvent) -> None:
        self._client.collection("orientation_traces").document(
            event.request_id
        ).set(event.model_dump(mode="json"))

    def ready(self) -> bool:
        try:
            next(self._client.collections(), None)
        except Exception:
            return False
        return True


def build_trace_store(settings: Settings) -> TraceStore:
    if settings.trace_provider == "firestore":
        return FirestoreTraceStore(settings)
    return MemoryTraceStore()

