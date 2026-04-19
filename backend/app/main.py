from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.match import router as match_router
from app.api.routes.resume import router as resume_router
from app.api.routes.resume_store import router as resume_store_router
from app.core.config import settings
from app.core.db import init_db


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Resume parsing service for career planning and future vector matching.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1", tags=["health"])
app.include_router(resume_router, prefix="/api/v1", tags=["resume"])
app.include_router(resume_store_router, prefix="/api/v1", tags=["resumes"])
app.include_router(jobs_router, prefix="/api/v1", tags=["jobs"])
app.include_router(match_router, prefix="/api/v1", tags=["match"])


@app.on_event("startup")
async def startup_event() -> None:
    init_db()


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Resume parser backend is running."}
