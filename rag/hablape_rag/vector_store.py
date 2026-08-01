from __future__ import annotations

from langchain_core.documents import Document
from langchain_google_vertexai import VertexAIEmbeddings, VectorSearchVectorStore

from .models import CorpusChunk


def build_vector_store(
    *, project_id: str, location: str, collection_id: str
) -> VectorSearchVectorStore:
    embeddings = VertexAIEmbeddings(model_name="gemini-embedding-001")
    return VectorSearchVectorStore.from_components(
        project_id=project_id,
        region=location,
        collection_id=collection_id,
        embedding=embeddings,
        api_version="v2",
    )


def index_chunks(
    vector_store: VectorSearchVectorStore,
    chunks: list[CorpusChunk],
    *,
    batch_size: int = 20,
) -> list[str]:
    """Embed and index chunks in API-safe, sequential batches."""
    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")

    indexed_ids: list[str] = []
    total = len(chunks)

    for start in range(0, total, batch_size):
        batch = chunks[start : start + batch_size]
        documents = [
            Document(
                id=chunk.chunk_id,
                page_content=chunk.content,
                metadata=chunk.langchain_metadata(),
            )
            for chunk in batch
        ]
        batch_ids = [chunk.chunk_id for chunk in batch]
        result = vector_store.add_documents(
            documents=documents,
            ids=batch_ids,
        )
        indexed_ids.extend(result)
        print(f"Indexados {min(start + len(batch), total)} / {total}", flush=True)

    return indexed_ids
