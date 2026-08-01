from __future__ import annotations

import json
from collections.abc import Iterable
from urllib.parse import urlparse

from google.api_core.client_options import ClientOptions
from google.cloud import documentai_v1beta3 as documentai
from google.cloud import storage

from .models import LayoutBlock


def _split_gcs_uri(uri: str) -> tuple[str, str]:
    parsed = urlparse(uri)
    if parsed.scheme != "gs" or not parsed.netloc:
        raise ValueError(f"URI de GCS inválida: {uri}")
    return parsed.netloc, parsed.path.lstrip("/")


def submit_layout_batch(
    *,
    project_id: str,
    location: str,
    processor_id: str,
    processor_version: str | None,
    input_prefix_uri: str,
    output_prefix_uri: str,
    chunk_size: int = 800,
    timeout_seconds: int = 3600,
) -> dict[str, str]:
    """Procesa PDF grandes de forma batch y conserva jerarquía de layout."""
    client = documentai.DocumentProcessorServiceClient(
        client_options=ClientOptions(
            api_endpoint=f"{location}-documentai.googleapis.com"
        )
    )
    if processor_version:
        name = client.processor_version_path(
            project_id, location, processor_id, processor_version
        )
    else:
        name = client.processor_path(project_id, location, processor_id)
    options = documentai.ProcessOptions(
        layout_config=documentai.ProcessOptions.LayoutConfig(
            enable_table_annotation=True,
            enable_image_annotation=False,
            chunking_config=(
                documentai.ProcessOptions.LayoutConfig.ChunkingConfig(
                    chunk_size=chunk_size,
                    include_ancestor_headings=True,
                )
            ),
        )
    )
    request = documentai.BatchProcessRequest(
        name=name,
        input_documents=documentai.BatchDocumentsInputConfig(
            gcs_prefix=documentai.GcsPrefix(gcs_uri_prefix=input_prefix_uri)
        ),
        document_output_config=documentai.DocumentOutputConfig(
            gcs_output_config=documentai.DocumentOutputConfig.GcsOutputConfig(
                gcs_uri=output_prefix_uri
            )
        ),
        process_options=options,
        skip_human_review=True,
    )
    operation = client.batch_process_documents(request=request)
    operation.result(timeout=timeout_seconds)
    metadata = documentai.BatchProcessMetadata(operation.metadata)
    if metadata.state != documentai.BatchProcessMetadata.State.SUCCEEDED:
        raise RuntimeError(
            f"Document AI batch falló: {metadata.state_message}"
        )
    destinations: dict[str, str] = {}
    errors: list[str] = []
    for status in metadata.individual_process_statuses:
        if status.status.code:
            errors.append(
                f"{status.input_gcs_source}: {status.status.message}"
            )
            continue
        if status.input_gcs_source and status.output_gcs_destination:
            destinations[status.input_gcs_source] = status.output_gcs_destination
    if errors:
        raise RuntimeError("Document AI rechazó documentos: " + "; ".join(errors))
    if not destinations:
        raise RuntimeError("Document AI terminó sin destinos de salida.")
    return destinations


def _walk_blocks(blocks: Iterable[dict]) -> Iterable[LayoutBlock]:
    for block in blocks:
        span = block.get("pageSpan", {})
        page_start = int(span.get("pageStart", 1) or 1)
        page_end = int(span.get("pageEnd", page_start) or page_start)
        for key, default_type in (
            ("textBlock", "paragraph"),
            ("tableBlock", "table"),
            ("listBlock", "list"),
            ("imageBlock", "image"),
        ):
            payload = block.get(key)
            if not payload:
                continue
            text = str(payload.get("text", "")).strip()
            block_type = str(payload.get("type", default_type)).lower()
            children = payload.get("blocks", [])
            if text and (not children or block_type.startswith(("title", "heading"))):
                yield LayoutBlock(
                    text=text,
                    block_type=block_type,
                    page_start=page_start,
                    page_end=page_end,
                )
            if children:
                yield from _walk_blocks(children)
            break


def load_layout_results(
    *,
    project_id: str,
    output_prefix_uri: str,
    source_destinations: dict[str, str] | None = None,
) -> dict[str, list[LayoutBlock]]:
    """Lee los JSON de Document AI; la clave es el URI original del PDF."""
    client = storage.Client(project=project_id)
    grouped: dict[str, list[LayoutBlock]] = {}
    if source_destinations:
        sources = source_destinations.items()
    else:
        sources = [("", output_prefix_uri)]
    for known_source, destination in sources:
        bucket_name, prefix = _split_gcs_uri(destination)
        for blob in client.list_blobs(bucket_name, prefix=prefix):
            if not blob.name.endswith(".json"):
                continue
            payload = json.loads(blob.download_as_text())
            source_uri = known_source or str(payload.get("uri", ""))
            layout = payload.get("documentLayout", {})
            grouped.setdefault(source_uri, []).extend(
                _walk_blocks(layout.get("blocks", []))
            )
    for blocks in grouped.values():
        blocks.sort(key=lambda b: (b.page_start, b.page_end))
    return grouped
