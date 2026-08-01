"""Recupera chunks desde una salida batch existente de Document AI.

Útil para resultados cuyo JSON no conserva ``uri``. El nombre generado por
Document AI sí conserva el Drive file ID, que se cruza con el manifiesto de
ingesta guardado en Cloud Storage.
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from google.cloud import storage

from hablape_rag.chunking import AdaptiveLegalChunker
from hablape_rag.config import GcpSettings
from hablape_rag.document_ai import _walk_blocks
from hablape_rag.models import LayoutBlock, SourceDocument
from hablape_rag.pipeline import _apply_source_registry, _write_jsonl


def main() -> None:
    settings = GcpSettings.from_env()
    client = storage.Client(project=settings.project_id)
    bucket = client.bucket(settings.bucket)

    manifest_payload = json.loads(
        bucket.blob("corpus/manifests/drive-source.json").download_as_text()
    )
    documents = [
        SourceDocument.model_validate(item)
        for item in manifest_payload.get("documents", [])
    ]
    documents = _apply_source_registry(
        documents, Path(settings.source_registry)
    )
    by_drive_id = {document.drive_file_id: document for document in documents}

    prefix = "corpus/parsed/"
    blobs = [
        blob
        for blob in client.list_blobs(settings.bucket, prefix=prefix)
        if blob.name.endswith(".json")
    ]
    if not blobs:
        raise RuntimeError(f"No hay JSON bajo gs://{settings.bucket}/{prefix}")

    by_operation: dict[str, list[storage.Blob]] = defaultdict(list)
    for blob in blobs:
        relative = blob.name.removeprefix(prefix)
        operation_id = relative.split("/", 1)[0]
        by_operation[operation_id].append(blob)
    operation_id = max(
        by_operation,
        key=lambda key: max(blob.updated for blob in by_operation[key]),
    )

    blocks_by_document: dict[str, list[LayoutBlock]] = defaultdict(list)
    unmatched: list[str] = []
    for blob in by_operation[operation_id]:
        filename = blob.name.rsplit("/", 1)[-1]
        drive_id = next(
            (
                candidate
                for candidate in by_drive_id
                if filename.startswith(f"{candidate}-")
            ),
            None,
        )
        if not drive_id:
            unmatched.append(blob.name)
            continue
        payload = json.loads(blob.download_as_text())
        blocks_by_document[drive_id].extend(
            _walk_blocks(payload.get("documentLayout", {}).get("blocks", []))
        )

    chunker = AdaptiveLegalChunker(max_tokens=800, min_tokens=80)
    chunks = []
    for drive_id, document in by_drive_id.items():
        blocks = blocks_by_document.get(drive_id, [])
        blocks.sort(key=lambda block: (block.page_start, block.page_end))
        chunks.extend(chunker.chunk(document, blocks))

    output = Path("output/chunks.jsonl")
    _write_jsonl(output, chunks)
    bucket.blob("corpus/chunks/chunks.jsonl").upload_from_filename(
        str(output), content_type="application/x-ndjson"
    )
    print(
        json.dumps(
            {
                "operation_id": operation_id,
                "documents": len(documents),
                "documents_with_blocks": len(blocks_by_document),
                "chunks": len(chunks),
                "unmatched_json": len(unmatched),
                "output": str(output),
            }
        )
    )


if __name__ == "__main__":
    main()
