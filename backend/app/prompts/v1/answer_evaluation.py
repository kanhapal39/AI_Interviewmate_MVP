"""Versioned prompt templates for answer evaluation."""

from pydantic import BaseModel


class AnswerRubricSchema(BaseModel):
    """Schema for answer evaluation rubric."""

    competency: str
    overall_score: float = Field(
        ge=0.0, le=1.0,
        "Score 0-1 for this competency"
    )
    evidence_score: float = Field(
        ge=0.0, le=1.0,
        "How well the answer is supported by evidence"
    )
    clarity_score: float = Field(
        ge=0.0, le=1.0,
        "Answer clarity and communication"
    )
    actionability_score: float = Field(
        ge=0.0, le=1.0,
        "Whether the answer provides actionable insights"
    )
    strengths: list = Field(
        default_factory=list,
        "Identified strengths in the answer"
    )
    weaknesses: list = Field(
        default_factory=list,
        "Identified weaknesses or gaps in the answer"
    )
    missing_points: list = Field(
        default_factory=list,
        "Important points not addressed in the answer"
    )
    better_answer_guidance: str = Field(
        "",
        "Constructive guidance for a better answer"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        "Confidence in this evaluation"
    )
    evidence_from_answer: dict = Field(
        default_factory=dict,
        "Extracted evidence spans from the answer"
    )
    star_assessment: dict = Field(
        default_factory=dict,
        "STAR (Situation, Task, Action, Result) analysis if applicable"
    )
    coaching_guidance: str = Field(
        "",
        "Labeled as coaching guidance, not a claim about what the candidate said"
    )


class InterviewEvaluationSchema(BaseModel):
    """Schema for full interview evaluation output."""

    overall_score: float = Field(
        ge=0.0, le=1.0,
        "Overall interview performance score"
    )
    strengths: list = Field(
        default_factory=list,
        "Overall strengths"
    )
    weaknesses: list = Field(
        default_factory=list,
        "Overall weaknesses"
    )
    missing_points: list = Field(
        default_factory=list,
        "Missing or underdeveloped points"
    )
    better_answer_guidance: str = Field(
        "",
        "Guidance for improvement"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        "Confidence in the evaluation"
    )
    rubric_applied: str = Field(
        "",
        "Which rubric was used"
    )
    model_version: str = Field(
        "",
        "Mistral model version"
    )
    prompt_version: str = Field(
        "",
        "Prompt template version"
    )
    evidence_summary: dict = Field(
        default_factory=dict,
        "Summary of key evidence from answers"
    )
    practice_recommendations: list = Field(
        default_factory=list,
        "Recommendations for practice"
    )
    star_assessments: list = Field(
        default_factory=list,
        "STAR assessments for behavioral questions"
    )
    coaching_flag: bool = Field(
        default=False,
        "Whether guidance is labeled as coaching, not claims"
    )