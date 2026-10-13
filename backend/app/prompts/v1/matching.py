"""Versioned prompt templates for resume-JD matching."""

from pydantic import BaseModel


class MatchCategory(str, Enum):
    """Match category enum."""

    MUST_HAVE = "must_have"
    SHOULD_HAVE = "should_have"
    NICE_TO_HAVE = "nice_to_have"


class MatchComponent(BaseModel):
    """Individual match component output."""

    category: MatchCategory
    requirement: str
    matched_evidence: str  # from resume
    confidence: float = Field(ge=0.0, le=1.0)
    source_reference: str  # resume section/page


class ResumeJDMatchingSchema(BaseModel):
    """Schema for resume-JD matching output."""

    overall_match: float = Field(
        ge=0.0, le=1.0,
        "Weighted match score (deterministic calculation outside model)"
    )
    methodology_version: str = Field(
        default="v1.0.0",
        "Version of the matching methodology"
    )
    component_breakdown: dict = Field(
        default_factory=dict,
        "Per-category scores with evidence counts",
    )
    must_have: list = Field(
        default_factory=list,
        "Must Have requirements with match/miss evidence"
    )
    should_have: list = Field(
        default_factory=list,
        "Should Have requirements with match/miss evidence"
    )
    nice_to_have: list = Field(
        default_factory=list,
        "Nice to Have requirements with match/miss evidence"
    )
    matched_evidence: list = Field(
        default_factory=list,
        "List of evidence spans linked to matched requirements"
    )
    unmatched_requirements: list = Field(
        default_factory=list,
        "Requirements with no matching evidence"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        "Confidence in the match score"
    )
    uncertainty_notes: list = Field(
        default_factory=list,
        "Documented areas of uncertainty"
    )
    score_breakdown_details: dict = Field(
        default_factory=dict,
        "Human-readable breakdown: 25% Skills, 20% Experience, etc."
    )