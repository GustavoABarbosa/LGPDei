from beanie import init_beanie
from pymongo import AsyncMongoClient

from app.config import settings
from app.models import AssessmentSession, Message, SessionDocument
from app.models.user import User


async def init_db() -> AsyncMongoClient:
    client: AsyncMongoClient = AsyncMongoClient(settings.mongodb_uri, tz_aware=True)
    await init_beanie(
        database=client.get_default_database(),
        document_models=[AssessmentSession, Message, SessionDocument, User],
    )
    return client
