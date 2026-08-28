from fastapi import APIRouter, Depends, File, Header, Request, UploadFile

from app.dependencies import get_owned_session
from app.middleware.rate_limit import limiter
from app.models import AssessmentSession
from app.services.document_service import delete_session_document, upload_session_document

documents_router = APIRouter(prefix="/sessions/{session_id}/documents", tags=["documents"])


def locale_from_header(accept_language: str | None) -> str:
    if accept_language and accept_language.lower().startswith("en"):
        return "en"
    return "pt"


@documents_router.post("")
@limiter.limit("10/hour")
async def upload_document(
    request: Request,
    session_id: str,
    file: UploadFile = File(...),
    session: AssessmentSession = Depends(get_owned_session),
    accept_language: str | None = Header(default=None),
):
    locale = locale_from_header(accept_language)
    doc = await upload_session_document(session, file, locale)
    return {"document": doc}


@documents_router.delete("/{doc_id}")
async def remove_document(
    session_id: str,
    doc_id: str,
    session: AssessmentSession = Depends(get_owned_session),
):
    await delete_session_document(session, doc_id)
    return {"ok": True}
