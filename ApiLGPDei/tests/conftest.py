import os

# Force test settings before app.config is imported (overrides ApiLGPDei/.env).
os.environ["APP_ENV"] = "test"
os.environ["MONGODB_URI"] = os.environ.get(
    "TEST_MONGODB_URI",
    "mongodb://lgpdei:change-me-strong-password@127.0.0.1:27017/lgpdei_test?authSource=admin",
)
os.environ["SESSION_SECRET"] = "test-session-secret-at-least-32-characters"
os.environ["JWT_SECRET"] = "test-jwt-secret-at-least-32-characters-long"
os.environ["ANTHROPIC_API_KEY"] = "test-key"
os.environ["COOKIE_SECURE"] = "false"
os.environ["PII_MODE"] = "off"

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from langchain_core.messages import AIMessage  # noqa: E402
from pymongo import AsyncMongoClient  # noqa: E402

from app.agents import nodes  # noqa: E402
from app.config import settings  # noqa: E402
from app.database import init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.middleware.rate_limit import limiter  # noqa: E402
from tests.fakes import FAKE_CHAT_REPLY, FakeChatModel  # noqa: E402


@pytest.fixture(autouse=True)
def fake_llm(monkeypatch):
    monkeypatch.setattr(
        nodes,
        "create_chat_model",
        lambda: FakeChatModel(messages=iter([AIMessage(content=FAKE_CHAT_REPLY)])),
    )


@pytest_asyncio.fixture
async def client():
    mongo: AsyncMongoClient = AsyncMongoClient(settings.mongodb_uri)
    await mongo.drop_database(mongo.get_default_database().name)
    await mongo.close()

    db_client = await init_db()
    limiter.reset()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http:
        yield http
    await db_client.close()


@pytest_asyncio.fixture
async def other_client(client):
    """A second browser without the first one's cookies, sharing the same database."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http:
        yield http
