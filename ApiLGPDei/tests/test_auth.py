PASSWORD = "Segura#123"


async def register(client, email="ana@example.com"):
    return await client.post(
        "/api/auth/register",
        json={"name": "Ana", "email": email, "password": PASSWORD},
    )


async def test_register_sets_cookie_and_me_returns_user(client):
    response = await register(client)
    assert response.status_code == 200
    assert "auth_token" in response.cookies

    me = await client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["user"]["email"] == "ana@example.com"


async def test_register_rejects_weak_password(client):
    response = await client.post(
        "/api/auth/register",
        json={"name": "Ana", "email": "ana@example.com", "password": "fraca123"},
    )
    assert response.status_code == 422


async def test_register_rejects_duplicate_email(client):
    await register(client)
    response = await register(client)
    assert response.status_code == 409


async def test_login_with_wrong_password_fails(client):
    await register(client)
    client.cookies.clear()
    response = await client.post(
        "/api/auth/login",
        json={"email": "ana@example.com", "password": "Errada#123"},
    )
    assert response.status_code == 401


async def test_logout_clears_session(client):
    await register(client)
    await client.post("/api/auth/logout")
    assert (await client.get("/api/auth/me")).status_code == 401


async def test_guest_sessions_are_linked_on_register(client):
    created = await client.post("/api/sessions", json={"locale": "pt"})
    session_id = created.json()["session"]["id"]

    await register(client)
    client.cookies.delete("session_token")

    sessions = (await client.get("/api/sessions")).json()["sessions"]
    assert [s["id"] for s in sessions] == [session_id]
