from tests.fakes import FAKE_ASSESSMENT, FAKE_CHAT_REPLY, parse_sse


async def send(client, session_id, content):
    response = await client.post(
        f"/api/sessions/{session_id}/messages/stream",
        json={"content": content},
        headers={"X-Locale": "pt"},
    )
    assert response.status_code == 200
    return parse_sse(response.text)


async def create_session_id(client) -> str:
    response = await client.post("/api/sessions", json={"locale": "pt"})
    return response.json()["session"]["id"]


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
