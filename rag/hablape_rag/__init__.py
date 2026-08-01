"""Pipeline RAG trazable de HablaPE para Google Cloud."""

from .chunking import AdaptiveLegalChunker
from .models import CorpusChunk, LayoutBlock, SourceDocument

__all__ = [
    "AdaptiveLegalChunker",
    "CorpusChunk",
    "LayoutBlock",
    "SourceDocument",
]

