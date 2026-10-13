"""Versioned prompt templates for interview question generation."""

from pydantic import BaseModel
from enum import Enum


class QuestionCategory(str, Enum):
    """Interview question categories."""

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


class QuestionDifficulty(str, Enum):
    """Question difficulty levels."""

    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewQuestionSchema(BaseModel):
    """Schema for generated interview question."""

    category: QuestionCategory
    difficulty: QuestionDifficulty
    question: str
    relevance_reason: str  # Why this question is relevant for this candidate
    competency: str  # e.g., "leadership", "problem-solving"
    rubric: dict = Field(
        default_factory=dict,
        "Scoring rubric for evaluation"
    )
    expected_answer_signals: list = Field(
        default_factory=list,
        "Key phrases or evidence expected in good answers"
    )
    source_references: dict = Field(
        default_factory=dict,
        "References to resume/JD sections used to generate question"
    )
    source_version: str = Field(
        "",
        "Version of resume/JD used as source"
    )


class QuestionSetSchema(BaseModel):
    """Schema for a set of generated questions."""

    questions: list = Field(
        default_factory=list,
        "List of generated interview questions"
    )
    target_role: str
    interview_round: str
    difficulty_profile: str  # e.g., "mixed", "technical-heavy", "behavioral-heavy"
    total_questions: int
    generated_at: str
    methodology_version: str = Field(
        default="v1.0.0",
        "Prompt/methodology version"
    )