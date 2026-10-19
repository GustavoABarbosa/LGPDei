from app.consent import CONSENT_VERSION
from app.models.user import User
from tests.helpers import PASSWORD, create_session, register


async def test_register_sets_cookie_and_me_returns_user(client):
    response = await register(client)
    assert response.status_code == 200
    assert "auth_token" in response.cookies

    me = await client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["user"]["email"] == "ana@example.com"


async def test_register_requires_consent_and_stores_it(client):
    assert (await register(client, consent=False)).status_code == 400

    await register(client)
    user = await User.find_one(User.email == "ana@example.com")
    assert user and user.consent_version == CONSENT_VERSION and user.consent_at


async def test_register_rejects_weak_password(client):
    response = await client.post(
        "/api/auth/register",
        json={"name": "Ana", "email": "ana@example.com", "password": "fraca123", "consent": True},
    )
    assert response.status_code == 422


async def test_register_rejects_duplicate_email(client):
    await register(client)
    response = await register(client)
    assert response.status_code == 409


async def test_register_rejects_duplicate_email_in_other_case(client):
    await register(client)
    response = await register(client, email="ANA@Example.com")
    assert response.status_code == 409


async def test_login_with_wrong_password_fails(client):
    await register(client)
    client.cookies.clear()
    response = await client.post(
        "/api/auth/login",
        json={"email": "ana@example.com", "password": "Errada#123"},
    )
    assert response.status_code == 401


async def test_login_is_rate_limited(client):
    for _ in range(10):
        await client.post("/api/auth/login", json={"email": "ana@example.com", "password": "Errada#123"})
    response = await client.post("/api/auth/login", json={"email": "ana@example.com", "password": PASSWORD})
    assert response.status_code == 429


async def test_logout_clears_session(client):
    await register(client)
    await client.post("/api/auth/logout")
    assert (await client.get("/api/auth/me")).status_code == 401


async def test_logout_revokes_the_token(client, other_client):
    await register(client)
    token = client.cookies["auth_token"]
    await client.post("/api/auth/logout")

    other_client.cookies.set("auth_token", token)
    assert (await other_client.get("/api/auth/me")).status_code == 401


async def test_guest_sessions_are_linked_on_register_when_opted_in(client):
    session_id = (await create_session(client))["id"]

    await register(client, adopt_guest_sessions=True)
    client.cookies.delete("session_token")

    sessions = (await client.get("/api/sessions")).json()["sessions"]
    assert [s["id"] for s in sessions] == [session_id]


async def test_guest_sessions_are_not_linked_by_default(client):
    session_id = (await create_session(client))["id"]

    await register(client, adopt_guest_sessions=False)
    client.cookies.delete("session_token")

    sessions = (await client.get("/api/sessions")).json()["sessions"]
    assert sessions == []

    # Guest session remains accessible only with the original session cookie + no JWT...
    # After register, auth cookie exists; session_token was deleted above.
    # Recreate guest cookie would be needed; assert account list is empty is enough.


async def test_update_profile(client):
    await register(client)
    response = await client.patch("/api/auth/me", json={"name": "Ana Souza", "email": "Nova@Example.com"})
    assert response.status_code == 200
    user = response.json()["user"]
    assert (user["name"], user["email"]) == ("Ana Souza", "nova@example.com")

    me = await client.get("/api/auth/me")
    assert me.json()["user"]["email"] == "nova@example.com"


async def test_email_change_revokes_previous_tokens(client, other_client):
    await register(client)
    old_token = client.cookies["auth_token"]
    await client.patch("/api/auth/me", json={"email": "nova@example.com"})

    other_client.cookies.set("auth_token", old_token)
    assert (await other_client.get("/api/auth/me")).status_code == 401
    assert (await client.get("/api/auth/me")).status_code == 200


async def test_update_profile_rejects_taken_email(client, other_client):
    await register(other_client, email="bia@example.com")
    await register(client)
    response = await client.patch("/api/auth/me", json={"email": "BIA@example.com"})
    assert response.status_code == 409
