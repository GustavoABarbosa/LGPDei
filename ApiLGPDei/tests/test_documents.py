from tests.helpers import create_session_id, send, upload


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
    assert listed[0]["preview"] == "Coletamos CPF e e-mail."

    assert (await client.delete(f"/api/sessions/{session_id}/documents/{doc['id']}")).status_code == 200
    assert (await client.get(f"/api/sessions/{session_id}")).json()["documents"] == []


async def test_deleting_document_removes_it_from_message_attachments(client):
    session_id = await create_session_id(client)
    doc = (await upload(client, session_id)).json()["document"]
    await upload(client, session_id, name="contrato.txt")
    await send(client, session_id, "Analise os arquivos", attachments=["politica.txt", "contrato.txt"])

    await client.delete(f"/api/sessions/{session_id}/documents/{doc['id']}")

    user_message = (await client.get(f"/api/sessions/{session_id}")).json()["messages"][0]
    assert user_message["attachments"] == ["contrato.txt"]


async def test_unsupported_file_is_rejected(client):
    session_id = await create_session_id(client)
    response = await upload(client, session_id, name="virus.exe", content=b"MZ", mime="application/octet-stream")
    assert response.status_code == 400


async def test_other_browser_cannot_upload(client, other_client):
    session_id = await create_session_id(client)
    response = await upload(other_client, session_id)
    assert response.status_code == 403
