from beanie import init_beanie

from app.config import settings
from app.models import AssessmentSession, Message, SessionDocument
from app.models.user import User


async def init_db() -> None:
    await init_beanie(
        connection_string=settings.mongodb_uri,
        document_models=[AssessmentSession, Message, SessionDocument, User],
    )
