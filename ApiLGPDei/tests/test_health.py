import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.knowledge_service import get_knowledge_manifest


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    manifest = get_knowledge_manifest()
    assert body["status"] == "ok"
    assert body["knowledgeVersion"] == manifest["version"]
    assert body["knowledgeUpdatedAt"] == manifest["updated_at"]
