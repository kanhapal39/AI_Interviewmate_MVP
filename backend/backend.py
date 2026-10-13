"""Main FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine

from app.core.config import settings
from app.db.base import Base
from app.api.v1.router import router as api_router

# Import all models to ensure they are registered for SQLAlchemy metadata
from app.db import models  # noqa: F401

app = FastAPI(
    title="InterviewMate API",
    description="AI-powered career preparation platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup():
    """Initialize database schema on startup."""
    engine = create_engine(settings.DATABASE_URL.replace("+psycopg2", ""))
    Base.metadata.create_all(bind=engine)


@app.get("/")
async def root():
    return {"message": "InterviewMate API is running", "version": "0.1.0"}