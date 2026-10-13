from datetime import datetime

from beanie.operators import In

from app.models import AssessmentSession, Message, SessionDocument
from app.models.user import User
from app.services.session_service import delete_sessions
from app.utils.time import utcnow


async def find_user_sessions(user: User) -> list[AssessmentSession]:
    return await AssessmentSession.find(AssessmentSession.user_id == user.id).sort("created_at").to_list()


async def delete_account(user: User) -> None:
    sessions = await find_user_sessions(user)
    await delete_sessions([session.id for session in sessions])
    await user.delete()


def isoformat(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


async def export_account(user: User) -> dict:
    sessions = await find_user_sessions(user)
    session_ids = [session.id for session in sessions]
    messages = await Message.find(In(Message.session_id, session_ids)).sort("created_at").to_list()
    documents = await SessionDocument.find(In(SessionDocument.session_id, session_ids)).sort("order").to_list()

    return {
        "exportedAt": utcnow().isoformat(),
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "createdAt": user.created_at.isoformat(),
        },
        "consent": {
            "version": user.consent_version,
            "acceptedAt": user.consent_at.isoformat(),
        },
        "sessions": [
            {
                "id": str(session.id),
                "title": session.title,
                "contextSummary": session.context_summary,
                "guestConsent": {
                    "version": session.consent_version,
                    "acceptedAt": isoformat(session.consent_at),
                }
                if session.consent_version
                else None,
                "createdAt": session.created_at.isoformat(),
                "updatedAt": session.updated_at.isoformat(),
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
                    if m.session_id == session.id
                ],
                "documents": [
                    {
                        "id": str(d.id),
                        "fileName": d.file_name,
                        "mimeType": d.mime_type,
                        "extractedText": d.extracted_text,
                        "uploadedAt": d.uploaded_at.isoformat(),
                    }
                    for d in documents
                    if d.session_id == session.id
                ],
            }
            for session in sessions
        ],
    }
