from beanie.operators import In, Pull
from fastapi import UploadFile

from app.config import settings
from app.models import AssessmentSession, Message, SessionDocument
from app.models.user import PublicUser
from app.services.document_parser import extract_document_text, is_supported_file
from app.services.session_service import list_sessions_for_token, list_sessions_for_user
from app.utils.http_error import HttpError
from app.utils.time import utcnow


async def upload_session_document(
    session: AssessmentSession,
    file: UploadFile,
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
        expires_at=session.expires_at,
        file_name=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        extracted_text=extracted,
        order=existing_count,
    )
    await doc.insert()

    session.updated_at = utcnow()
    await session.save()

    return {
        "id": str(doc.id),
        "fileName": doc.file_name,
        "mimeType": doc.mime_type,
        "order": doc.order,
        "uploadedAt": doc.uploaded_at.isoformat(),
    }


async def list_accessible_documents(
    *,
    user: PublicUser | None,
    session_token: str | None,
) -> list[dict]:
    if user:
        sessions = await list_sessions_for_user(user)
    elif session_token:
        sessions = await list_sessions_for_token(session_token)
    else:
        return []

    if not sessions:
        return []

    session_map = {session.id: session for session in sessions}
    session_ids = list(session_map.keys())
    documents = await SessionDocument.find(
        In(SessionDocument.session_id, session_ids)
    ).sort("-uploaded_at").to_list()

    return [
        {
            "id": str(document.id),
            "fileName": document.file_name,
            "mimeType": document.mime_type,
            "order": document.order,
            "uploadedAt": document.uploaded_at.isoformat(),
            "sessionId": str(document.session_id),
            "sessionTitle": session_map[document.session_id].title,
        }
        for document in documents
    ]


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
    # Attachments are stored by file name, so keep it while another upload with the same name remains.
    same_name = await SessionDocument.find_one(
        SessionDocument.session_id == session.id,
        SessionDocument.file_name == doc.file_name,
    )
    if not same_name:
        await Message.find(
            Message.session_id == session.id,
            Message.attachments == doc.file_name,
        ).update(Pull({Message.attachments: doc.file_name}))
    session.updated_at = utcnow()
    await session.save()
