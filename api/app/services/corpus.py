from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.schemas import Journey, SourceCitation, SourceDocument


class CorpusError(RuntimeError):
    pass


class CorpusRepository:
    def __init__(self, manifest_path: Path, chunks_path: Path) -> None:
        self._manifest_path = manifest_path
        self._chunks_path = chunks_path
        self._manifest: dict[str, Any] = {}
        self._chunks: list[dict[str, Any]] = []
        self._documents: dict[str, dict[str, Any]] = {}
        self.reload()

    @property
    def version(self) -> str:
        return str(self._manifest["corpus_version"])

    @property
    def review_status(self) -> str:
        return str(self._manifest["review_status"])

    def reload(self) -> None:
        try:
            self._manifest = json.loads(
                self._manifest_path.read_text(encoding="utf-8")
            )
            chunk_data = json.loads(
                self._chunks_path.read_text(encoding="utf-8")
            )
        except (OSError, json.JSONDecodeError) as exc:
            raise CorpusError(f"No se pudo cargar el corpus: {exc}") from exc

        self._chunks = list(chunk_data.get("chunks", []))
        self._documents = {
            document["id"]: document
            for document in self._manifest.get("documents", [])
        }
        if not self._documents or not self._chunks:
            raise CorpusError("El corpus no contiene documentos o chunks.")

        for chunk in self._chunks:
            if chunk.get("document_id") not in self._documents:
                raise CorpusError(
                    f"Chunk huérfano: {chunk.get('id', 'sin_id')}"
                )

    def list_documents(self) -> list[SourceDocument]:
        return [
            SourceDocument(
                id=document["id"],
                journey=document["journey"],
                title=document["title"],
                publisher=document["publisher"],
                official_url=document["official_url"],
                status=document["status"],
                relevant_sections=document.get("relevant_sections", []),
                notes=document.get("notes", ""),
            )
            for document in self._documents.values()
        ]

    def chunks_for(self, journey: Journey) -> list[dict[str, Any]]:
        target = (
            Journey.CONSUMER.value
            if journey == Journey.SECTORAL_CONSUMER
            else journey.value
        )
        return [
            chunk for chunk in self._chunks if chunk["journey"] == target
        ]

    def citations_for(self, journey: Journey) -> list[SourceCitation]:
        citations: list[SourceCitation] = []
        for chunk in self.chunks_for(journey):
            document = self._documents[chunk["document_id"]]
            if document["status"] == "verified_historical_not_current_alone":
                continue
            citations.append(
                SourceCitation(
                    chunk_id=chunk["id"],
                    document_id=document["id"],
                    title=document["title"],
                    publisher=document["publisher"],
                    locator=chunk["locator"],
                    official_url=document["official_url"],
                    corpus_version=self.version,
                    source_status=document["status"],
                )
            )
        return citations

    def official_rules_for(self, journey: Journey) -> list[str]:
        return [
            chunk["plain_rule"]
            for chunk in self.chunks_for(journey)
            if self._documents[chunk["document_id"]]["status"]
            != "verified_historical_not_current_alone"
        ]

    def has_chunk(self, chunk_id: str) -> bool:
        return any(chunk["id"] == chunk_id for chunk in self._chunks)

