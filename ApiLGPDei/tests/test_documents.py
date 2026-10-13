async def create_session_id(client) -> str:
    response = await client.post("/api/sessions", json={"locale": "pt"})
    return response.json()["session"]["id"]


async def upload(client, session_id, name="politica.txt", content=b"Coletamos CPF e e-mail.", mime="text/plain"):
    return await client.post(
        f"/api/sessions/{session_id}/documents",
        files={"file": (name, content, mime)},
    )


async def test_upload_list_and_delete(client):
    session_id = await create_session_id(client)

    uploaded = await upload(client, session_id)
    assert uploaded.status_code == 200
    doc = uploaded.json()["document"]
    assert doc["fileName"] == "politica.txt"

    detail = (await client.get(f"/api/sessions/{session_id}")).json()
    assert [d["id"] for d in detail["documents"]] == [doc["id"]]

    listed = (await client.get("/api/documents")).json()["documents"]
    assert listed[0]["sessionId"] == session_id

    assert (await client.delete(f"/api/sessions/{session_id}/documents/{doc['id']}")).status_code == 200
    assert (await client.get(f"/api/sessions/{session_id}")).json()["documents"] == []


async def test_unsupported_file_is_rejected(client):
    session_id = await create_session_id(client)
    response = await upload(client, session_id, name="virus.exe", content=b"MZ", mime="application/octet-stream")
    assert response.status_code == 400


async def test_other_browser_cannot_upload(client, other_client):
    session_id = await create_session_id(client)
    response = await upload(other_client, session_id)
    assert response.status_code == 403
