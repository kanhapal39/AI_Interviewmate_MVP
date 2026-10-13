"""Versioned prompt templates for gap analysis."""

from pydantic import BaseModel


class GapAnalysisSchema(BaseModel):
    """Schema for gap analysis output."""

    gaps: list = Field(
        default_factory=list,
        "List of identified gaps",
    )
    gap_definitions: dict = Field(
        default_factory=dict,
        "Why each gap matters",
    )
    evidence_from_jd: dict = Field(
        default_factory=dict,
        "Evidence from job description for each gap"
    )
    suggested_actions: list = Field(
        default_factory=list,
        "Suggested actions to address each gap",
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        "Overall confidence in gap identification"
    )
    insufficient_evidence: list = Field(
        default_factory=list,
        "Gaps where evidence was insufficient",
    )


class ResumeSuggestionSchema(BaseModel):
    """Schema for resume suggestion output."""

    original: str = Field(
        "", "Original resume content/bullet"
    )
    ai_suggestion: str = Field(
        "", "AI-generated suggestion (based on confirmed evidence only)"
    )
    reason: str = Field(
        "",
        "Why this suggestion was generated (evidence-based)"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        "Confidence in the suggestion"
    )
    evidence_map: dict = Field(
        default_factory=dict,
        "Mapping of suggestion to source evidence"
    )
    should_export: bool = Field(
        default=False,
        "Whether this suggestion should be included in export"
    )