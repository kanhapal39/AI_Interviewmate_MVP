"""Pytest configuration for backend integration tests."""

import os
import sys
from pathlib import Path
from typing import Generator, AsyncGenerator
from uuid import uuid4

import pytest
import httpx
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# Set test environment variables BEFORE importing app
os.environ["DATABASE_URL"] = "postgresql://localhost/ai_interview_mate_test"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["AI_PROVIDER"] = "nvidia"
os.environ["NVIDIA_API_KEY"] = "test-key"
os.environ["ENABLE_MOCK_PROVIDER"] = "true"

# Clear any cached settings
import app.core.config as config_module
config_module.get_settings.cache_clear()


@pytest.fixture(scope="session")
def engine():
    """Create test database engine using PostgreSQL."""
    from app.db.base import Base
    # Import models to register them with Base metadata
    from app.db import models as db_models  # noqa: F401

    # Use PostgreSQL for tests (UUID types not supported in SQLite)
    database_url = os.environ.get("DATABASE_URL", "postgresql://localhost/ai_interview_mate_test")
    engine = create_engine(database_url)

    # Create tables once at the start of the test session
    # Do NOT drop tables at the end - use transaction rollback for isolation
    Base.metadata.create_all(bind=engine)
    yield engine
    # Note: We do NOT drop tables at the end to avoid issues with concurrent test runs
    # Tables will be cleaned up by transaction rollback in db_session fixture


@pytest.fixture(scope="function")
def db_session(engine) -> Generator[Session, None, None]:
    """Create a new database session for each test with transaction rollback."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def async_client(db_session) -> httpx.AsyncClient:
    """Create an async HTTP client with overridden database dependency using httpx."""
    from backend import app
    from app.db.session import get_db

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # Use httpx with ASGITransport for async client
    transport = httpx.ASGITransport(app=app)
    client = httpx.AsyncClient(transport=transport, base_url="http://testserver")

    yield client

    app.dependency_overrides.clear()
    # Close the async client
    import asyncio
    asyncio.get_event_loop().run_until_complete(client.aclose())


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    from app.db import models as db_models

    user = db_models.User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        password_hash="hashed_password",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_workspace(db_session, test_user):
    """Create a test workspace."""
    from app.db import models as db_models

    workspace = db_models.Workspace(
        id=uuid4(),
        name="Test Workspace",
        owner_id=test_user.id,
        is_default=True,
    )
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


@pytest.fixture
def test_resume(db_session, test_user, test_workspace):
    """Create a test resume with raw text."""
    from app.db import models as db_models

    resume = db_models.Resume(
        id=uuid4(),
        workspace_id=test_workspace.id,
        user_id=test_user.id,
        source_file="uploads/test_resume.pdf",
        original_filename="test_resume.pdf",
        raw_text="""
        John Doe
        Software Engineer
        Experience:
        - Built microservices using Docker and Kubernetes on AWS EKS
        - 5 years of React experience with TypeScript and Redux
        - Led team of 5 engineers delivering 3 major product releases
        Skills: Python, React, TypeScript, Docker, Kubernetes, AWS
        Education: BS Computer Science
        """,
        parse_status="parsed",
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)
    return resume


@pytest.fixture
def test_jd(db_session, test_user, test_workspace):
    """Create a test job description with raw text."""
    from app.db import models as db_models

    jd = db_models.JobDescription(
        id=uuid4(),
        workspace_id=test_workspace.id,
        user_id=test_user.id,
        source_file="uploads/test_jd.txt",
        original_filename="test_jd.txt",
        raw_text="""
        Senior Software Engineer at TechCorp
        Requirements:
        - 5+ years of experience with React and TypeScript
        - Experience with Kubernetes orchestration
        - Strong background in microservices architecture
        - Experience with CI/CD pipelines
        Preferred:
        - GraphQL API design experience
        - AWS cloud experience
        """,
        parse_status="parsed",
    )
    db_session.add(jd)
    db_session.commit()
    db_session.refresh(jd)
    return jd