from beanie import PydanticObjectId

from app.models import AssessmentSession, Message, SessionDocument
from app.models.user import PublicUser
from app.utils.time import utcnow


async def get_session_detail(session: AssessmentSession) -> dict:
    messages = await Message.find(Message.session_id == session.id).sort("created_at").to_list()
    documents = await SessionDocument.find(
        SessionDocument.session_id == session.id
    ).sort("order").to_list()

    return {
        "session": {
            "id": str(session.id),
            "title": session.title,
            "contextSummary": session.context_summary,
            "createdAt": session.created_at.isoformat(),
            "updatedAt": session.updated_at.isoformat(),
        },
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "messageType": m.message_type,
                "assessmentSnapshot": m.assessment_snapshot.model_dump() if m.assessment_snapshot else None,
                "attachments": m.attachments,
                "createdAt": m.created_at.isoformat(),
            }
            for m in messages
        ],
        "documents": [
            {
                "id": str(d.id),
                "fileName": d.file_name,
                "mimeType": d.mime_type,
                "order": d.order,
                "uploadedAt": d.uploaded_at.isoformat(),
            }
            for d in documents
        ],
    }


async def list_sessions_for_token(session_token: str) -> list[AssessmentSession]:
    from app.utils.session_token import hash_session_token

    token_hash = hash_session_token(session_token)
    return await AssessmentSession.find(
        AssessmentSession.session_token_hash == token_hash
    ).sort("-updated_at").to_list()


async def list_sessions_for_user(user: PublicUser) -> list[AssessmentSession]:
    return await AssessmentSession.find(
        AssessmentSession.user_id == PydanticObjectId(user.id)
    ).sort("-updated_at").to_list()


async def link_sessions_for_token(session_token: str, user_id: str) -> None:
    from app.utils.session_token import hash_session_token

    token_hash = hash_session_token(session_token)
    sessions = await AssessmentSession.find(
        AssessmentSession.session_token_hash == token_hash,
        AssessmentSession.user_id == None,
    ).to_list()

    user_oid = PydanticObjectId(user_id)
    for session in sessions:
        session.user_id = user_oid
        await session.save()


async def update_session_title_from_message(session: AssessmentSession, content: str) -> None:
    if session.title not in ("Nova sessão", "New session"):
        return
    title = content.strip()[:48]
    if title:
        session.title = title
        session.updated_at = utcnow()
        await session.save()
