async def create_session(client):
    response = await client.post("/api/sessions", json={"locale": "pt"})
    assert response.status_code == 200
    return response.json()["session"]


async def test_create_list_rename_delete(client):
    session = await create_session(client)
    assert "session_token" in client.cookies

    listed = (await client.get("/api/sessions")).json()["sessions"]
    assert [s["id"] for s in listed] == [session["id"]]

    renamed = await client.patch(f"/api/sessions/{session['id']}", json={"title": "Clínica"})
    assert renamed.json()["session"]["title"] == "Clínica"

    assert (await client.delete(f"/api/sessions/{session['id']}")).status_code == 200
    assert (await client.get(f"/api/sessions/{session['id']}")).status_code == 404


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
    response = await client.post("/api/sessions", json={"locale": "pt"})
    assert response.status_code == 429
