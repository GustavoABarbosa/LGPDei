from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings

CSRF_HEADER = "x-requested-with"
CSRF_HEADER_VALUE = "LGPDei"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


class CsrfHeaderMiddleware(BaseHTTPMiddleware):
    """Requires a custom header on mutating requests when cookies are SameSite=None."""

    async def dispatch(self, request: Request, call_next):
        if (
            settings.csrf_required
            and request.method.upper() not in SAFE_METHODS
            and request.url.path.startswith("/api/")
            and request.headers.get(CSRF_HEADER, "").lower() != CSRF_HEADER_VALUE.lower()
        ):
            return JSONResponse(
                status_code=403,
                content={"message": "Cabeçalho CSRF ausente ou inválido"},
            )
        return await call_next(request)
