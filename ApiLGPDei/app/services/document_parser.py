import csv
import io
from pathlib import Path

from docx import Document as DocxDocument
from pypdf import PdfReader

from app.config import settings
from app.utils.http_error import HttpError

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".csv"}
SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/csv",
}


def resolve_mime_type(file_name: str, mime_type: str | None) -> str:
    if mime_type and mime_type != "application/octet-stream":
        return mime_type
    ext = Path(file_name).suffix.lower()
    mapping = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
        ".md": "text/markdown",
        ".csv": "text/csv",
    }
    return mapping.get(ext, "application/octet-stream")


def is_supported_file(file_name: str, mime_type: str | None) -> bool:
    ext = Path(file_name).suffix.lower()
    if ext in SUPPORTED_EXTENSIONS:
        return True
    resolved = resolve_mime_type(file_name, mime_type)
    return resolved in SUPPORTED_MIME_TYPES


def _truncate(text: str) -> str:
    if len(text) <= settings.max_extracted_text_chars:
        return text
    return text[: settings.max_extracted_text_chars] + "\n\n[Truncado]"


def _extract_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            parts.append(text)
    return "\n".join(parts)


def _extract_docx(data: bytes) -> str:
    doc = DocxDocument(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _extract_csv(data: bytes) -> str:
    text = data.decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text))
    rows = [" | ".join(row) for row in reader]
    return "\n".join(rows)


async def extract_document_text(data: bytes, file_name: str, mime_type: str | None) -> str:
    if not is_supported_file(file_name, mime_type):
        raise HttpError(400, "Tipo de arquivo não suportado")

    ext = Path(file_name).suffix.lower()
    resolved = resolve_mime_type(file_name, mime_type)

    try:
        if ext == ".pdf" or resolved == "application/pdf":
            text = _extract_pdf(data)
        elif ext == ".docx" or "wordprocessingml" in resolved:
            text = _extract_docx(data)
        elif ext == ".csv" or resolved == "text/csv":
            text = _extract_csv(data)
        else:
            text = data.decode("utf-8", errors="replace")
    except Exception as exc:
        raise HttpError(400, f"Não foi possível extrair texto do arquivo: {exc}") from exc

    text = text.strip()
    if not text:
        raise HttpError(400, "O arquivo não contém texto extraível")

    return _truncate(text)
