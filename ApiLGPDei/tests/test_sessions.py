from beanie import PydanticObjectId

from app.models import AssessmentSession, Message, SessionDocument
from tests.helpers import create_session, register, send, upload


async def get_stored(session_id: str) -> AssessmentSession:
    session = await AssessmentSession.get(PydanticObjectId(session_id))
    assert session
    return session


async def test_create_list_rename_delete(client):
    session = await create_session(client)
    assert "session_token" in client.cookies

    listed = (await client.get("/api/sessions")).json()["sessions"]
    assert [s["id"] for s in listed] == [session["id"]]

    renamed = await client.patch(f"/api/sessions/{session['id']}", json={"title": "Clínica"})
    assert renamed.json()["session"]["title"] == "Clínica"

    assert (await client.delete(f"/api/sessions/{session['id']}")).status_code == 200
    assert (await client.get(f"/api/sessions/{session['id']}")).status_code == 404


async def test_delete_session_removes_messages_and_documents(client):
    session = await create_session(client)
    oid = PydanticObjectId(session["id"])
    await upload(client, session["id"])
    await send(client, session["id"], "O que é base legal?")

    await client.delete(f"/api/sessions/{session['id']}")

    assert await Message.find(Message.session_id == oid).count() == 0
    assert await SessionDocument.find(SessionDocument.session_id == oid).count() == 0


async def test_timestamps_are_utc(client):
    session = await create_session(client)
    assert session["createdAt"].endswith("+00:00")


async def test_other_browser_cannot_read_session(client, other_client):
    session = await create_session(client)
    response = await other_client.get(f"/api/sessions/{session['id']}")
    assert response.status_code == 403


async def test_invalid_session_id_is_not_found(client):
    assert (await client.get("/api/sessions/not-an-id")).status_code == 404


async def test_session_creation_is_rate_limited(client):
    for _ in range(5):
        await create_session(client)
    response = await client.post("/api/sessions", json={"locale": "pt", "consent": True})
    assert response.status_code == 429


async def test_guest_session_requires_consent(client):
    response = await client.post("/api/sessions", json={"locale": "pt"})
    assert response.status_code == 400

    session = await get_stored((await create_session(client))["id"])
    assert session.consent_version and session.consent_at


async def test_next_guest_session_inherits_consent_and_reuses_cookie(client):
    first = await create_session(client)
    token = client.cookies["session_token"]

    second = await create_session(client, consent=False)
    assert client.cookies["session_token"] == token

    listed = (await client.get("/api/sessions")).json()["sessions"]
    assert {s["id"] for s in listed} == {first["id"], second["id"]}
    assert (await get_stored(second["id"])).consent_at == (await get_stored(first["id"])).consent_at


async def test_guest_sessions_expire_and_account_sessions_do_not(client):
    guest = await get_stored((await create_session(client))["id"])
    assert guest.expires_at is not None
    assert guest.user_id is None

    await register(client)
    owned = await get_stored((await create_session(client, consent=False))["id"])
    assert owned.expires_at is None
    assert owned.user_id is not None


async def test_adoption_clears_expiry_of_sessions_messages_and_documents(client):
    session_id = (await create_session(client))["id"]
    oid = PydanticObjectId(session_id)
    await upload(client, session_id)
    await send(client, session_id, "O que é base legal?")
    assert await Message.find(Message.session_id == oid, Message.expires_at != None).count() == 2  # noqa: E711

    await register(client, adopt_guest_sessions=True)

    assert (await get_stored(session_id)).expires_at is None
    assert await Message.find(Message.session_id == oid, Message.expires_at != None).count() == 0  # noqa: E711
    assert await SessionDocument.find(
        SessionDocument.session_id == oid, SessionDocument.expires_at != None  # noqa: E711
    ).count() == 0


async def test_session_token_cannot_access_account_owned_session(client, other_client):
    await register(client, adopt_guest_sessions=False)
    session_id = (await create_session(client, consent=False))["id"]
    session = await get_stored(session_id)
    assert session.user_id is not None

    # Second browser with only the session_token cookie (no JWT) must be denied.
    other_client.cookies.set("session_token", client.cookies["session_token"])
    response = await other_client.get(f"/api/sessions/{session_id}")
    assert response.status_code == 403
