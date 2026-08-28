from datetime import datetime

from fastapi import UploadFile

from app.config import settings
from app.models import AssessmentSession, Message, SessionDocument
from app.services.document_parser import extract_document_text, is_supported_file
from app.utils.http_error import HttpError


async def upload_session_document(
    session: AssessmentSession,
    file: UploadFile,
    locale: str,
) -> dict:
    existing_count = await SessionDocument.find(
        SessionDocument.session_id == session.id
    ).count()

    if existing_count >= settings.max_files_per_session:
        raise HttpError(400, f"Máximo de {settings.max_files_per_session} arquivos por sessão")

    if not file.filename or not is_supported_file(file.filename, file.content_type):
        raise HttpError(400, "Tipo de arquivo não suportado")

    data = await file.read()
    if len(data) > settings.max_file_size_bytes:
        raise HttpError(400, f"Arquivo excede {settings.max_file_size_mb} MB")

    total_text = 0
    existing_docs = await SessionDocument.find(
        SessionDocument.session_id == session.id
    ).to_list()
    total_text = sum(len(d.extracted_text) for d in existing_docs)

    extracted = await extract_document_text(data, file.filename, file.content_type)
    if total_text + len(extracted) > settings.max_extracted_text_chars:
        raise HttpError(400, "Limite total de texto extraído da sessão excedido")

    doc = SessionDocument(
        session_id=session.id,
        file_name=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        extracted_text=extracted,
        order=existing_count,
    )
    await doc.insert()

    user_count = await Message.find(
        Message.session_id == session.id,
        Message.role == "user",
    ).count()

    if user_count == 0:
        label = "Recebi seu documento" if locale == "pt" else "I received your document"
        await Message(
            session_id=session.id,
            role="assistant",
            content=f"{label} (**{file.filename}**). Vou considerar essas informações na nossa conversa.",
        ).insert()

    session.updated_at = datetime.utcnow()
    await session.save()

    return {
        "id": str(doc.id),
        "fileName": doc.file_name,
        "mimeType": doc.mime_type,
        "order": doc.order,
        "uploadedAt": doc.uploaded_at.isoformat(),
    }


async def delete_session_document(session: AssessmentSession, doc_id: str) -> None:
    from beanie import PydanticObjectId

    try:
        oid = PydanticObjectId(doc_id)
    except Exception as exc:
        raise HttpError(404, "Documento não encontrado") from exc

    doc = await SessionDocument.get(oid)
    if not doc or doc.session_id != session.id:
        raise HttpError(404, "Documento não encontrado")

    await doc.delete()
    session.updated_at = datetime.utcnow()
    await session.save()
