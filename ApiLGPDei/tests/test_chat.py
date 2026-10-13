from beanie import PydanticObjectId

from app.models import AssessmentSession
from tests.fakes import FAKE_ASSESSMENT, FAKE_CHAT_REPLY
from tests.helpers import create_session_id, send


async def test_chat_streams_tokens_and_stores_messages(client):
    session_id = await create_session_id(client)
    events = await send(client, session_id, "O que é base legal?")

    assert len(events) > 1
    assert "".join(e["content"] for e in events) == FAKE_CHAT_REPLY

    user, assistant = (await client.get(f"/api/sessions/{session_id}")).json()["messages"][-2:]
    assert user["role"] == "user"
    assert (assistant["role"], assistant["messageType"], assistant["content"]) == ("assistant", "chat", FAKE_CHAT_REPLY)


async def test_assessment_returns_structured_report(client):
    session_id = await create_session_id(client)
    events = await send(client, session_id, "Quero gerar análise completa da minha clínica")

    assert len(events) == 1
    assert f"{FAKE_ASSESSMENT.compliance_score}/100" in events[0]["content"]

    last = (await client.get(f"/api/sessions/{session_id}")).json()["messages"][-1]
    assert last["messageType"] == "assessment"
    assert last["assessmentSnapshot"]["overall_risk"] == "high"
    assert last["assessmentSnapshot"]["disclaimer"]


async def test_stream_error_is_generic(client, monkeypatch):
    from app.agents import nodes

    def broken_model():
        raise RuntimeError("secret upstream detail")

    monkeypatch.setattr(nodes, "create_chat_model", broken_model)
    session_id = await create_session_id(client)
    events = await send(client, session_id, "O que é base legal?")

    assert events[-1]["error"]
    assert "secret" not in events[-1]["error"]


async def test_guest_session_without_consent_cannot_receive_messages(client):
    session_id = await create_session_id(client)
    session = await AssessmentSession.get(PydanticObjectId(session_id))
    session.consent_version = None
    await session.save()

    response = await client.post(
        f"/api/sessions/{session_id}/messages/stream",
        json={"content": "Olá"},
    )
    assert response.status_code == 403
