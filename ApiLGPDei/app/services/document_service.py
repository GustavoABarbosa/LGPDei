from beanie.operators import In, Pull
from fastapi import UploadFile

from app.config import settings
from app.models import AssessmentSession, Message, SessionDocument
from app.models.user import PublicUser
import re

from app.services.document_parser import extract_document_text, is_supported_file
from app.services.pageindex_service import build_tree_from_text, choose_indexing_mode
from app.services.session_service import list_sessions_for_token, list_sessions_for_user
from app.utils.http_error import HttpError
from app.utils.time import utcnow

PREVIEW_MAX_CHARS = 160


def document_preview(extracted_text: str, *, max_chars: int = PREVIEW_MAX_CHARS) -> str:
    """Short plain-text snippet for document lists (not the full extracted body)."""
    compact = re.sub(r"\s+", " ", extracted_text).strip()
    if len(compact) <= max_chars:
        return compact
    return compact[: max_chars - 1].rstrip() + "…"


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

    indexing_mode = choose_indexing_mode(extracted, settings.pageindex_min_chars)
    page_index_tree = None
    if indexing_mode == "pageindex":
        try:
            page_index_tree = build_tree_from_text(extracted, root_title=file.filename)
        except Exception:
            indexing_mode = "full"
            page_index_tree = None

    doc = SessionDocument(
        session_id=session.id,
        expires_at=session.expires_at,
        file_name=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        extracted_text=extracted,
        indexing_mode=indexing_mode,
        page_index_tree=page_index_tree,
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
        "indexingMode": doc.indexing_mode,
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
            "preview": document_preview(document.extracted_text),
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
