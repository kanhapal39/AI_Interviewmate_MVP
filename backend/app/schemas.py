"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────────
class ParseStatus(str, Enum):
    PENDING = "pending"
    PARSED = "parsed"
    FAILED = "failed"
    CORRECTING = "correcting"


class SessionStatus(str, Enum):
    IDLE = "idle"
    RECORDING = "recording"
    TRANSCRIBING = "transcribing"
    REVIEW = "review"
    SUBMITTED = "submitted"
    GENERATING_FEEDBACK = "generating_feedback"
    ERROR = "error"
    PAUSED = "paused"


class QuestionCategory(str, Enum):
    RECRUITER = "recruiter"
    HR = "hr"
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    PRODUCT = "product"
    SYSTEM_DESIGN = "system_design"
    CASE_STUDY = "case_study"
    PROBLEM_SOLVING = "problem_solving"
    SITUATIONAL = "situational"
    DOMAIN = "domain"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class MatchCategory(str, Enum):
    MUST_HAVE = "must_have"
    SHOULD_HAVE = "should_have"
    NICE_TO_HAVE = "nice_to_have"


# ── User ─────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Workspace ────────────────────────────────────────────────────────
class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Resume ───────────────────────────────────────────────────────────
class ResumeCreate(BaseModel):
    workspace_id: UUID
    user_id: UUID
    source_file: str
    original_filename: str


class ResumeResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    user_id: UUID
    original_filename: str
    parse_status: str
    version_counter: int
    created_at: datetime
    confirmed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Job Description ──────────────────────────────────────────────────
class JobDescriptionCreate(BaseModel):
    workspace_id: UUID
    user_id: UUID
    source_file: str
    original_filename: str
    raw_text: Optional[str] = None


class JobDescriptionResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    user_id: UUID
    original_filename: str
    parse_status: str
    version: int
    created_at: datetime
    confirmed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Analysis ─────────────────────────────────────────────────────────
class AnalysisCreate(BaseModel):
    resume_id: UUID
    job_description_id: UUID
    user_id: UUID


class AnalysisResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    resume_id: UUID
    job_description_id: UUID
    score: Optional[float]
    methodology_version: str
    score_breakdown: Optional[Dict[str, Any]]
    gaps: Optional[List[Dict[str, Any]]]
    recommendations: Optional[List[Dict[str, Any]]]
    status: str
    confidence: Optional[float]
    model_version: Optional[str]
    prompt_version: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Gap Analysis ─────────────────────────────────────────────────────
class GapAnalysisResponse(BaseModel):
    gaps: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]


class SuggestionResponse(BaseModel):
    id: UUID
    original: str
    ai_suggestion: str
    reason: str
    confidence: float
    evidence_map: Optional[Dict[str, Any]]
    should_export: bool = False

    class Config:
        from_attributes = True


# ── Interview ────────────────────────────────────────────────────────
class InterviewSessionCreate(BaseModel):
    workspace_id: UUID
    resume_id: Optional[UUID] = None
    job_description_id: Optional[UUID] = None
    type: str = "text"
    personality: Optional[str] = None
    duration_minutes: Optional[int] = None


class InterviewSessionResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    resume_id: Optional[UUID]
    job_description_id: Optional[UUID]
    type: str
    personality: Optional[str]
    duration_minutes: Optional[int]
    status: str
    score: Optional[float]
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class InterviewQuestionResponse(BaseModel):
    id: UUID
    session_id: UUID
    sequence: int
    category: str
    difficulty: str
    prompt: str
    rubric: Optional[Dict[str, Any]]
    expected_answer_signals: Optional[List[str]]
    competency: Optional[str]
    source_references: Optional[Dict[str, Any]]
    relevance_reason: Optional[str]

    class Config:
        from_attributes = True


class InterviewAnswerCreate(BaseModel):
    question_id: UUID
    answer_text: str
    transcript_uri: Optional[str] = None


class InterviewAnswerResponse(BaseModel):
    id: UUID
    question_id: UUID
    session_id: UUID
    answer_text: str
    submission_time: datetime
    scores: Optional[Dict[str, Any]]
    evidence: Optional[Dict[str, Any]]
    confidence: Optional[float]

    class Config:
        from_attributes = True


# ── Practice ─────────────────────────────────────────────────────────
class PracticeSessionCreate(BaseModel):
    workspace_id: UUID
    resume_id: Optional[UUID] = None
    title: Optional[str] = None
    category: Optional[str] = None


class PracticeSessionResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    resume_id: Optional[UUID]
    title: Optional[str]
    category: Optional[str]
    status: str
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Readiness ────────────────────────────────────────────────────────
class ReadinessScoreResponse(BaseModel):
    overall_score: Optional[float]
    component_scores: Dict[str, float]
    methodology_version: str
    status: str
    insufficient_evidence: List[str]
    next_best_action: Optional[Dict[str, str]]