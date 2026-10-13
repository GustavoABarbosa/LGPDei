from beanie import PydanticObjectId

from app.consent import CONSENT_VERSION
from app.models import AssessmentSession, Message, SessionDocument
from app.models.user import User
from tests.helpers import PASSWORD, create_session, register, send, upload


async def delete_account(client, password=PASSWORD):
    return await client.request("DELETE", "/api/auth/me", json={"password": password})


async def create_account_with_data(client, email="ana@example.com") -> str:
    await register(client, email=email)
    session_id = (await create_session(client, consent=False))["id"]
    await upload(client, session_id)
    await send(client, session_id, "Quero gerar análise completa da minha clínica")
    return session_id


async def test_delete_account_requires_correct_password(client):
    await register(client)
    response = await delete_account(client, password="Errada#123")
    assert response.status_code == 403
    assert await User.find_one(User.email == "ana@example.com")


async def test_delete_account_removes_all_data_and_clears_cookies(client, other_client):
    session_id = await create_account_with_data(client)
    oid = PydanticObjectId(session_id)
    token = client.cookies["auth_token"]

    response = await delete_account(client)
    assert response.status_code == 200
    set_cookies = response.headers.get_list("set-cookie")
    assert any(c.startswith('auth_token=""') for c in set_cookies)
    assert any(c.startswith('session_token=""') for c in set_cookies)

    assert await User.find_one(User.email == "ana@example.com") is None
    assert await AssessmentSession.get(oid) is None
    assert await Message.find(Message.session_id == oid).count() == 0
    assert await SessionDocument.find(SessionDocument.session_id == oid).count() == 0

    other_client.cookies.set("auth_token", token)
    assert (await other_client.get("/api/auth/me")).status_code == 401


async def test_delete_account_keeps_other_users_data(client, other_client):
    other_session_id = await create_account_with_data(other_client, email="bia@example.com")
    await create_account_with_data(client)

    await delete_account(client)

    assert await AssessmentSession.get(PydanticObjectId(other_session_id))


async def test_export_contains_all_user_data(client):
    session_id = await create_account_with_data(client)

    response = await client.get("/api/auth/me/export")
    assert response.status_code == 200
    assert "attachment" in response.headers["content-disposition"]

    data = response.json()
    assert data["user"]["email"] == "ana@example.com"
    assert "password_hash" not in str(data) and "passwordHash" not in str(data)
    assert data["consent"]["version"] == CONSENT_VERSION

    [session] = data["sessions"]
    assert session["id"] == session_id
    assert [m["role"] for m in session["messages"]] == ["user", "assistant"]
    assert session["messages"][1]["assessmentSnapshot"]["overall_risk"] == "high"
    assert session["documents"][0]["extractedText"] == "Coletamos CPF e e-mail."


async def test_export_requires_login(client):
    assert (await client.get("/api/auth/me/export")).status_code == 401
