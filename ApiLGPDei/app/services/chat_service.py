from collections.abc import AsyncGenerator

from langchain_core.messages import AIMessage, AIMessageChunk, HumanMessage

from app.agents.nodes import agent_graph
from app.agents.prompts import append_disclaimer, strip_disclaimer
from app.agents.state import GraphState
from app.models import AssessmentSession, Message, SessionDocument
from app.utils.time import utcnow


async def load_session_context(session: AssessmentSession) -> tuple[list, list[dict], dict | None]:
    messages = await Message.find(Message.session_id == session.id).sort("created_at").to_list()
    documents = await SessionDocument.find(
        SessionDocument.session_id == session.id
    ).sort("order").to_list()

    lc_messages = []
    for msg in messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        else:
            lc_messages.append(AIMessage(content=strip_disclaimer(msg.content)))

    doc_context = [
        {"file_name": d.file_name, "extracted_text": d.extracted_text}
        for d in documents
    ]

    last_assessment = None
    for msg in reversed(messages):
        if msg.message_type == "assessment" and msg.assessment_snapshot:
            last_assessment = msg.assessment_snapshot.model_dump()
            break

    return lc_messages, doc_context, last_assessment


def locale_from_header(accept_language: str | None) -> str:
    if accept_language and accept_language.lower().startswith("en"):
        return "en"
    return "pt"


async def stream_chat_response(
    session: AssessmentSession,
    user_content: str,
    locale: str,
    attachments: list[str] | None = None,
) -> AsyncGenerator[str, None]:
    """Runs the agent graph, streaming chat tokens as they arrive and the assessment report once it is complete."""
    lc_messages, doc_context, last_assessment = await load_session_context(session)

    await Message(
        session_id=session.id,
        expires_at=session.expires_at,
        role="user",
        content=user_content,
        attachments=attachments or [],
    ).insert()

    lc_messages.append(HumanMessage(content=user_content))
    state: GraphState = {
        "session_id": str(session.id),
        "locale": locale,  # type: ignore[typeddict-item]
        "messages": lc_messages,
        "documents": doc_context,  # type: ignore[typeddict-item]
        "last_assessment": last_assessment,
        "user_content": user_content,
    }

    content = ""
    assessment = None
    async for mode, payload in agent_graph.astream(state, stream_mode=["messages", "updates"]):
        if mode == "messages":
            chunk, metadata = payload
            if metadata.get("langgraph_node") == "chat" and isinstance(chunk, AIMessageChunk) and chunk.text:
                content += chunk.text
                yield chunk.text
        elif "assess" in payload:
            content = payload["assess"]["response_content"]
            assessment = payload["assess"]["assessment_output"]
            yield content

    if not assessment:
        with_disclaimer = append_disclaimer(content, locale)  # type: ignore[arg-type]
        if with_disclaimer != content:
            yield with_disclaimer.removeprefix(content)
            content = with_disclaimer

    await Message(
        session_id=session.id,
        expires_at=session.expires_at,
        role="assistant",
        content=content,
        message_type="assessment" if assessment else "chat",
        assessment_snapshot=assessment,
    ).insert()

    session.updated_at = utcnow()
    await session.save()
