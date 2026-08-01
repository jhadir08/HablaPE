from __future__ import annotations

import hashlib
import io
import json
import re
from pathlib import PurePosixPath

import google.auth
from google.cloud import storage
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from .models import SourceDocument

DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly"


def _safe_name(name: str) -> str:
    cleaned = re.sub(r"[^0-9A-Za-z._-]+", "-", name).strip("-.")
    return cleaned or "document.pdf"


def _stable_document_id(file_id: str) -> str:
    return f"drive_{hashlib.sha256(file_id.encode()).hexdigest()[:16]}"


def sync_drive_folder_to_gcs(
    *,
    project_id: str,
    folder_id: str,
    bucket_name: str,
    prefix: str = "corpus/raw/identidad",
) -> list[SourceDocument]:
    """Copia los PDF directos de una carpeta compartida de Drive a GCS.

    La cuenta de Workbench (o su service account) debe tener acceso de lectura
    a la carpeta. No se guardan llaves JSON en el notebook.
    """
    credentials, _ = google.auth.default(scopes=[DRIVE_SCOPE])
    drive = build("drive", "v3", credentials=credentials, cache_discovery=False)
    storage_client = storage.Client(project=project_id)
    bucket = storage_client.bucket(bucket_name)

    response = (
        drive.files()
        .list(
            q=(
                f"'{folder_id}' in parents and trashed = false and "
                "mimeType = 'application/pdf'"
            ),
            fields="files(id,name,mimeType,modifiedTime,webViewLink,size)",
            pageSize=1000,
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        )
        .execute()
    )
    documents: list[SourceDocument] = []
    for item in response.get("files", []):
        buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(
            buffer, drive.files().get_media(fileId=item["id"])
        )
        done = False
        while not done:
            _, done = downloader.next_chunk()
        data = buffer.getvalue()
        digest = hashlib.sha256(data).hexdigest()
        object_name = str(
            PurePosixPath(prefix) / f"{item['id']}-{_safe_name(item['name'])}"
        )
        blob = bucket.blob(object_name)
        blob.metadata = {
            "drive_file_id": item["id"],
            "drive_filename": item["name"],
            "sha256": digest,
        }
        blob.upload_from_string(data, content_type="application/pdf")
        documents.append(
            SourceDocument(
                document_id=_stable_document_id(item["id"]),
                drive_file_id=item["id"],
                drive_filename=item["name"],
                gcs_uri=f"gs://{bucket_name}/{object_name}",
                sha256=digest,
                source_url=item.get("webViewLink")
                or f"https://drive.google.com/file/d/{item['id']}/view",
                is_official=False,
            )
        )
    # Mantener el manifiesto fuera del prefijo de entrada de Document AI:
    # batchProcess debe encontrar solamente PDF bajo ``prefix``.
    manifest = bucket.blob("corpus/manifests/drive-source.json")
    manifest.upload_from_string(
        json.dumps(
            {"documents": [doc.model_dump() for doc in documents]},
            ensure_ascii=False,
            indent=2,
        ),
        content_type="application/json",
    )
    return documents
