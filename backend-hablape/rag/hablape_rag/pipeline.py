from __future__ import annotations

import argparse
import json
from pathlib import Path

from google.cloud import storage

from .chunking import AdaptiveLegalChunker
from .config import GcpSettings
from .document_ai import load_layout_results, submit_layout_batch
from .drive_sync import sync_drive_folder_to_gcs
from .models import CorpusChunk, SourceDocument
from .vector_store import build_vector_store, index_chunks


def _write_jsonl(path: Path, chunks: list[CorpusChunk]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for chunk in chunks:
            handle.write(chunk.model_dump_json() + "\n")


def _read_jsonl(path: Path) -> list[CorpusChunk]:
    return [
        CorpusChunk.model_validate_json(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def _apply_source_registry(
    documents: list[SourceDocument], registry_path: Path
) -> list[SourceDocument]:
    """Aplica solo metadatos jurídicos explícitamente revisados por humanos."""
    if not registry_path.exists():
        raise FileNotFoundError(
            f"No existe el registro de fuentes revisadas: {registry_path}"
        )
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    entries = registry.get("documents", {})
    output: list[SourceDocument] = []
    for document in documents:
        entry = entries.get(document.drive_file_id, {})
        output.append(
            document.model_copy(
                update={
                    "journey": entry.get("journey", "no_clasificado"),
                    "is_official": bool(entry.get("is_official", False)),
                    "source_url": entry.get(
                        "official_url", document.source_url
                    ),
                }
            )
        )
    return output


def run(output_path: Path, *, should_index: bool) -> list[CorpusChunk]:
    settings = GcpSettings.from_env()
    documents = sync_drive_folder_to_gcs(
        project_id=settings.project_id,
        folder_id=settings.drive_folder_id,
        bucket_name=settings.bucket,
    )
    documents = _apply_source_registry(
        documents, Path(settings.source_registry)
    )
    input_prefix = f"gs://{settings.bucket}/corpus/raw/identidad/"
    output_prefix = f"gs://{settings.bucket}/corpus/parsed/"
    source_destinations = submit_layout_batch(
        project_id=settings.project_id,
        location=settings.documentai_location,
        processor_id=settings.documentai_processor_id,
        processor_version=settings.documentai_processor_version,
        input_prefix_uri=input_prefix,
        output_prefix_uri=output_prefix,
    )
    layouts = load_layout_results(
        project_id=settings.project_id,
        output_prefix_uri=output_prefix,
        source_destinations=source_destinations,
    )
    chunker = AdaptiveLegalChunker(max_tokens=800, min_tokens=80)
    chunks: list[CorpusChunk] = []
    for document in documents:
        chunks.extend(chunker.chunk(document, layouts.get(document.gcs_uri, [])))
    _write_jsonl(output_path, chunks)
    storage.Client(project=settings.project_id).bucket(settings.bucket).blob(
        "corpus/chunks/chunks.jsonl"
    ).upload_from_filename(str(output_path), content_type="application/x-ndjson")
    if should_index:
        vector_store = build_vector_store(
            project_id=settings.project_id,
            location=settings.location,
            collection_id=settings.vector_collection_id,
        )
        index_chunks(vector_store, chunks)
    return chunks


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingesta RAG de HablaPE en GCP")
    parser.add_argument("--output", type=Path, default=Path("output/chunks.jsonl"))
    parser.add_argument("--index", action="store_true")
    parser.add_argument(
        "--index-existing",
        type=Path,
        help="Indexa un JSONL ya revisado sin repetir Drive ni Document AI.",
    )
    args = parser.parse_args()
    if args.index_existing:
        settings = GcpSettings.from_env()
        chunks = _read_jsonl(args.index_existing)
        store = build_vector_store(
            project_id=settings.project_id,
            location=settings.location,
            collection_id=settings.vector_collection_id,
        )
        ids = index_chunks(store, chunks)
        print(json.dumps({"indexed": len(ids), "input": str(args.index_existing)}))
        return
    chunks = run(args.output, should_index=args.index)
    print(json.dumps({"chunks": len(chunks), "output": str(args.output)}))


if __name__ == "__main__":
    main()
