from __future__ import annotations

import hashlib
import re
import unicodedata
from dataclasses import dataclass, field

from .models import CorpusChunk, LayoutBlock, SourceDocument

LEGAL_HEADING = re.compile(
    r"^(?P<kind>LIBRO|T[IÍ]TULO|SECCI[OÓ]N|CAP[IÍ]TULO|SUBCAP[IÍ]TULO)\b",
    re.IGNORECASE,
)
ARTICLE = re.compile(
    r"^(?P<label>Art[ií]culo\s+(?:[IVXLCDM]+|\d+[A-Z]?)(?:[.°º-])?)"
    r"(?:\s*(?P<title>.*))?$",
    re.IGNORECASE,
)
NUMBERED_HEADING = re.compile(r"^(?P<num>\d+(?:\.\d+){0,4})[.)]?\s+\S")

LEVELS = {
    "libro": 1,
    "titulo": 2,
    "seccion": 3,
    "capitulo": 4,
    "subcapitulo": 5,
    "articulo": 6,
}


def _fold(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in value if not unicodedata.combining(ch)).lower()


def _clean(text: str) -> str:
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def _approx_tokens(text: str) -> int:
    return max(1, round(len(text) / 4.2))


def _heading_level(block: LayoutBlock, *, inside_article: bool = False) -> int | None:
    text = _clean(block.text)
    article = ARTICLE.match(text)
    if article:
        return LEVELS["articulo"]
    legal = LEGAL_HEADING.match(text)
    if legal:
        return LEVELS[_fold(legal.group("kind"))]
    if block.block_type.startswith("title"):
        return 0
    match = re.search(r"heading[-_ ]?(\d+)", block.block_type)
    if match:
        return min(5, int(match.group(1)))
    numbered = NUMBERED_HEADING.match(text)
    if numbered and not inside_article and len(text) <= 220:
        return min(5, numbered.group("num").count(".") + 1)
    if block.block_type.startswith("heading"):
        return 3
    return None


def _split_long_paragraph(text: str, max_tokens: int) -> list[str]:
    if _approx_tokens(text) <= max_tokens:
        return [text]
    sentences = re.split(r"(?<=[.;!?])\s+(?=[A-ZÁÉÍÓÚÑ0-9])", text)
    parts: list[str] = []
    current: list[str] = []
    for sentence in sentences:
        if current and _approx_tokens(" ".join(current + [sentence])) > max_tokens:
            parts.append(" ".join(current))
            current = []
        current.append(sentence)
    if current:
        parts.append(" ".join(current))
    return parts


@dataclass
class _Pending:
    headings: list[str]
    paragraphs: list[str] = field(default_factory=list)
    page_start: int = 1
    page_end: int = 1


class AdaptiveLegalChunker:
    """Parte por estructura jurídica y solo después por tamaño.

    Los títulos se conservan exactamente como aparecen en Document AI. No se
    usa un LLM para inventar o corregir encabezados.
    """

    def __init__(self, *, max_tokens: int = 800, min_tokens: int = 80) -> None:
        if min_tokens >= max_tokens:
            raise ValueError("min_tokens debe ser menor que max_tokens")
        self.max_tokens = max_tokens
        self.min_tokens = min_tokens

    def chunk(
        self, document: SourceDocument, blocks: list[LayoutBlock]
    ) -> list[CorpusChunk]:
        useful: list[LayoutBlock] = []
        for block in blocks:
            text = _clean(block.text)
            if not text or block.block_type in {"page_header", "page_footer"}:
                continue
            lines = text.splitlines()
            # Layout Parser puede entregar el encabezado del artículo y su
            # cuerpo en un solo bloque. Separarlos evita perder el cuerpo.
            if len(lines) > 1 and ARTICLE.match(lines[0]):
                useful.append(block.model_copy(update={"text": lines[0]}))
                useful.append(
                    block.model_copy(
                        update={
                            "text": "\n".join(lines[1:]),
                            "block_type": "paragraph",
                        }
                    )
                )
            else:
                useful.append(block.model_copy(update={"text": text}))
        if not useful:
            return []
        title_block = next(
            (b for b in useful if b.block_type.startswith("title")), None
        )
        title_exact = (
            title_block.text if title_block else document.drive_filename
        )
        headings: dict[int, str] = {}
        pending: _Pending | None = None
        output: list[CorpusChunk] = []

        def flush() -> None:
            nonlocal pending
            if not pending or not pending.paragraphs:
                pending = None
                return
            output.append(self._build_chunk(document, title_exact, pending))
            pending = None

        for block in useful:
            if block is title_block:
                continue
            inside_article = any(ARTICLE.match(value) for value in headings.values())
            level = _heading_level(block, inside_article=inside_article)
            if level is not None:
                flush()
                headings = {k: v for k, v in headings.items() if k < level}
                headings[level] = block.text
                continue
            if block.block_type in {"table", "list"}:
                paragraphs = [block.text]
            else:
                paragraphs = _split_long_paragraph(block.text, self.max_tokens)
            for paragraph in paragraphs:
                path = [headings[key] for key in sorted(headings)]
                candidate = "\n\n".join(path + ([paragraph] if paragraph else []))
                if (
                    pending
                    and pending.headings == path
                    and _approx_tokens(
                        "\n\n".join(pending.paragraphs + [candidate])
                    )
                    <= self.max_tokens
                ):
                    pending.paragraphs.append(paragraph)
                    pending.page_end = max(pending.page_end, block.page_end)
                else:
                    flush()
                    pending = _Pending(
                        headings=path,
                        paragraphs=[paragraph],
                        page_start=block.page_start,
                        page_end=block.page_end,
                    )
        flush()
        return output

    @staticmethod
    def _build_chunk(
        document: SourceDocument, title: str, pending: _Pending
    ) -> CorpusChunk:
        context = [title] + pending.headings + pending.paragraphs
        content = "\n\n".join(dict.fromkeys(item for item in context if item))
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        locator = next(
            (
                heading
                for heading in reversed(pending.headings)
                if ARTICLE.match(heading)
            ),
            f"págs. {pending.page_start}-{pending.page_end}",
        )
        identity = "|".join(
            (
                document.document_id,
                locator,
                str(pending.page_start),
                content_hash,
            )
        )
        return CorpusChunk(
            chunk_id=f"chk-{hashlib.sha256(identity.encode()).hexdigest()[:24]}",
            document_id=document.document_id,
            document_title_exact=title,
            heading_path_exact=pending.headings,
            locator=locator,
            page_start=pending.page_start,
            page_end=pending.page_end,
            content=content,
            content_sha256=content_hash,
            source_sha256=document.sha256,
            source_url=document.source_url,
            gcs_uri=document.gcs_uri,
            journey=document.journey,
            is_official=document.is_official,
            is_synthetic=document.is_synthetic,
        )
