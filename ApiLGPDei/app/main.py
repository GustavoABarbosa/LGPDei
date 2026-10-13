from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.database import init_db
from app.middleware.rate_limit import limiter
from app.routers.auth import auth_router
from app.routers.documents import all_documents_router, documents_router
from app.routers.messages import messages_router
from app.routers.sessions import sessions_router
from app.utils.http_error import HttpError


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="LGPDei API", lifespan=lifespan)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, _exc: RateLimitExceeded):
    response = JSONResponse(
        status_code=429,
        content={"message": "Limite de requisições atingido."},
    )
    view_rate_limit = getattr(request.state, "view_rate_limit", None)
    return request.app.state.limiter._inject_headers(response, view_rate_limit)


app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Retry-After"],
)


@app.exception_handler(HttpError)
async def http_error_handler(_request: Request, exc: HttpError):
    return JSONResponse(status_code=exc.status_code, content={"message": exc.message})


@app.get("/api/health")
async def health():
    return {"status": "ok"}


app.include_router(auth_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(all_documents_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
