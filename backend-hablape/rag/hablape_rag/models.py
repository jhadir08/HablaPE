from __future__ import annotations

from pydantic import BaseModel, Field


class SourceDocument(BaseModel):
    document_id: str
    drive_file_id: str
    drive_filename: str
    gcs_uri: str
    mime_type: str = "application/pdf"
    sha256: str
    source_url: str
    journey: str = "identidad"
    is_official: bool = False
    is_synthetic: bool = False


class LayoutBlock(BaseModel):
    text: str
    block_type: str = "paragraph"
    page_start: int = 1
    page_end: int = 1


class CorpusChunk(BaseModel):
    chunk_id: str
    document_id: str
    document_title_exact: str
    heading_path_exact: list[str] = Field(default_factory=list)
    locator: str
    page_start: int
    page_end: int
    content: str
    content_sha256: str
    source_sha256: str
    source_url: str
    gcs_uri: str
    journey: str
    is_official: bool
    is_synthetic: bool = False
    review_status: str = "requires_human_legal_review"

    def langchain_metadata(self) -> dict[str, str | int | bool]:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "document_title_exact": self.document_title_exact,
            "heading_path_exact": " > ".join(self.heading_path_exact),
            "locator": self.locator,
            "page_start": self.page_start,
            "page_end": self.page_end,
            "source_url": self.source_url,
            "gcs_uri": self.gcs_uri,
            "journey": self.journey,
            "is_official": self.is_official,
            "is_synthetic": self.is_synthetic,
            "review_status": self.review_status,
            "source_sha256": self.source_sha256,
        }

