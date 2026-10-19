from tests.fakes import parse_sse

PASSWORD = "Segura#123"


async def register(client, email="ana@example.com", consent=True, adopt_guest_sessions=False):
    return await client.post(
        "/api/auth/register",
        json={
            "name": "Ana",
            "email": email,
            "password": PASSWORD,
            "consent": consent,
            "adopt_guest_sessions": adopt_guest_sessions,
        },
    )


async def create_session(client, consent=True) -> dict:
    response = await client.post("/api/sessions", json={"locale": "pt", "consent": consent})
    assert response.status_code == 200
    return response.json()["session"]


async def create_session_id(client) -> str:
    return (await create_session(client))["id"]


async def upload(client, session_id, name="politica.txt", content=b"Coletamos CPF e e-mail.", mime="text/plain"):
    return await client.post(
        f"/api/sessions/{session_id}/documents",
        files={"file": (name, content, mime)},
    )


async def send(client, session_id, content, attachments=()):
    response = await client.post(
        f"/api/sessions/{session_id}/messages/stream",
        json={"content": content, "attachments": list(attachments)},
        headers={"X-Locale": "pt"},
    )
    assert response.status_code == 200
    return parse_sse(response.text)
