from hablape_rag.chunking import AdaptiveLegalChunker
from hablape_rag.models import LayoutBlock, SourceDocument


def source() -> SourceDocument:
    return SourceDocument(
        document_id="cpp",
        drive_file_id="abc",
        drive_filename="Decreto Legislativo957.pdf.pdf",
        gcs_uri="gs://bucket/cpp.pdf",
        sha256="a" * 64,
        source_url="https://drive.google.com/file/d/abc/view",
        is_official=True,
    )


def test_preserves_exact_title_article_and_paragraphs() -> None:
    blocks = [
        LayoutBlock(
            text="NUEVO CÓDIGO PROCESAL PENAL",
            block_type="title",
            page_start=1,
            page_end=1,
        ),
        LayoutBlock(text="LIBRO SEGUNDO", block_type="heading-1", page_start=66),
        LayoutBlock(
            text="CAPÍTULO II: El Control de Identidad y la Videovigilancia",
            block_type="heading-3",
            page_start=67,
        ),
        LayoutBlock(
            text="Artículo 205.- Control de identidad policial",
            block_type="paragraph",
            page_start=67,
        ),
        LayoutBlock(
            text="La Policía podrá requerir la identificación de cualquier persona.",
            block_type="paragraph",
            page_start=67,
        ),
        LayoutBlock(
            text="La identificación se realizará en el lugar en que la persona se encontrare.",
            block_type="paragraph",
            page_start=67,
        ),
        LayoutBlock(
            text="1. La persona debe recibir facilidades para identificarse.",
            block_type="paragraph",
            page_start=67,
        ),
    ]
    chunks = AdaptiveLegalChunker(max_tokens=200, min_tokens=20).chunk(
        source(), blocks
    )
    assert len(chunks) == 1
    chunk = chunks[0]
    assert chunk.document_title_exact == "NUEVO CÓDIGO PROCESAL PENAL"
    assert chunk.heading_path_exact[-1] == "Artículo 205.- Control de identidad policial"
    assert chunk.locator == "Artículo 205.- Control de identidad policial"
    assert "La identificación se realizará" in chunk.content
    assert "1. La persona debe recibir facilidades" in chunk.content
    assert chunk.heading_path_exact[-1] == "Artículo 205.- Control de identidad policial"


def test_uses_exact_numbered_report_heading() -> None:
    blocks = [
        LayoutBlock(text="Informe Defensorial n.° 266", block_type="title"),
        LayoutBlock(text="3.2 Resultados de la supervisión", page_start=20),
        LayoutBlock(text="Primer hallazgo de la supervisión.", page_start=20),
    ]
    chunks = AdaptiveLegalChunker(max_tokens=200, min_tokens=20).chunk(
        source(), blocks
    )
    assert chunks[0].heading_path_exact == ["3.2 Resultados de la supervisión"]
    assert chunks[0].document_title_exact == "Informe Defensorial n.° 266"


def test_separates_article_header_from_body_in_same_layout_block() -> None:
    blocks = [
        LayoutBlock(text="LEY DE LA POLICÍA NACIONAL DEL PERÚ", block_type="title"),
        LayoutBlock(
            text=(
                "Artículo 3.- Atribuciones\n"
                "Son atribuciones del personal policial las siguientes."
            ),
            block_type="paragraph",
            page_start=3,
        ),
    ]
    chunks = AdaptiveLegalChunker(max_tokens=200, min_tokens=20).chunk(
        source(), blocks
    )
    assert chunks[0].locator == "Artículo 3.- Atribuciones"
    assert "Son atribuciones del personal policial" in chunks[0].content
