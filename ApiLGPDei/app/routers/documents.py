from fastapi import APIRouter, Depends, File, Request, UploadFile

from app.config import settings
from app.dependencies import (
    get_consented_session,
    get_optional_session_token,
    get_optional_user,
    get_owned_session,
)
from app.middleware.rate_limit import limiter
from app.models import AssessmentSession
from app.models.user import PublicUser
from app.services.document_service import (
    delete_session_document,
    list_accessible_documents,
    upload_session_document,
)

all_documents_router = APIRouter(prefix="/documents", tags=["documents"])
documents_router = APIRouter(prefix="/sessions/{session_id}/documents", tags=["documents"])


@all_documents_router.get("")
async def list_documents(
    session_token: str | None = Depends(get_optional_session_token),
    user: PublicUser | None = Depends(get_optional_user),
):
    documents = await list_accessible_documents(user=user, session_token=session_token)
    return {"documents": documents}


@documents_router.post("")
@limiter.limit(lambda: f"{settings.rate_limit_uploads_per_hour}/hour")
async def upload_document(
    request: Request,
    session_id: str,
    file: UploadFile = File(...),
    session: AssessmentSession = Depends(get_consented_session),
):
    doc = await upload_session_document(session, file)
    return {"document": doc}


@documents_router.delete("/{doc_id}")
async def remove_document(
    session_id: str,
    doc_id: str,
    session: AssessmentSession = Depends(get_owned_session),
):
    await delete_session_document(session, doc_id)
    return {"ok": True}
