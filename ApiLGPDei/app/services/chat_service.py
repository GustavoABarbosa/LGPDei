from collections.abc import AsyncGenerator
from datetime import datetime

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.agents.nodes import agent_graph, create_chat_model
from app.agents.prompts import build_chat_system_prompt, classify_intent
from app.agents.state import GraphState
from app.models import AssessmentSession, Message, SessionDocument


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
            lc_messages.append(AIMessage(content=msg.content))

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
    lc_messages, doc_context, last_assessment = await load_session_context(session)

    await Message(
        session_id=session.id,
        role="user",
        content=user_content,
        attachments=attachments or [],
    ).insert()

    lc_messages.append(HumanMessage(content=user_content))

    intent = classify_intent(user_content)

    if intent == "assess":
        state: GraphState = {
            "session_id": str(session.id),
            "locale": locale,  # type: ignore[typeddict-item]
            "messages": lc_messages,
            "documents": doc_context,
            "last_assessment": last_assessment,
            "user_content": user_content,
        }
        result = await agent_graph.ainvoke(state)
        content = result.get("response_content", "")
        assessment = result.get("assessment_output")

        chunk_size = 40
        for i in range(0, len(content), chunk_size):
            yield content[i : i + chunk_size]

        msg = Message(
            session_id=session.id,
            role="assistant",
            content=content,
            message_type="assessment" if assessment else "chat",
            assessment_snapshot=assessment,
        )
        await msg.insert()
    else:
        system = build_chat_system_prompt(locale, doc_context, last_assessment)  # type: ignore[arg-type]
        model = create_chat_model()
        full_messages = [SystemMessage(content=system), *lc_messages]

        assistant_content = ""
        async for chunk in model.astream(full_messages):
            text = chunk.content if isinstance(chunk.content, str) else str(chunk.content)
            if text:
                assistant_content += text
                yield text

        await Message(
            session_id=session.id,
            role="assistant",
            content=assistant_content,
            message_type="chat",
        ).insert()

    session.updated_at = datetime.utcnow()
    await session.save()
