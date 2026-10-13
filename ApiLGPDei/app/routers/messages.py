import json

from fastapi import APIRouter, Depends, Header, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.dependencies import get_owned_session
from app.middleware.rate_limit import limiter
from app.models import AssessmentSession
from app.services.chat_service import locale_from_header, stream_chat_response
from app.services.session_service import update_session_title_from_message

messages_router = APIRouter(prefix="/sessions/{session_id}/messages", tags=["messages"])


class StreamMessageBody(BaseModel):
    content: str = Field(min_length=1, max_length=8000)
    attachments: list[str] = Field(default_factory=list, max_length=10)


@messages_router.post("/stream")
@limiter.limit("30/hour")
async def stream_message(
    request: Request,
    session_id: str,
    body: StreamMessageBody,
    session: AssessmentSession = Depends(get_owned_session),
    accept_language: str | None = Header(default=None),
    x_locale: str | None = Header(default=None),
):
    locale = x_locale if x_locale in ("pt", "en") else locale_from_header(accept_language)
    await update_session_title_from_message(session, body.content)

    async def event_generator():
        try:
            async for chunk in stream_chat_response(
                session,
                body.content,
                locale,
                body.attachments,
            ):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
