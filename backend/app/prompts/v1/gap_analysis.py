"""Versioned prompt templates for gap analysis."""

from pydantic import BaseModel, Field


GAP_ANALYSIS_PROMPT = """You are an expert career coach analyzing a resume against a job description.

Resume Text:
{resume_text}

Job Description Text:
{jd_text}

Task: Identify specific gaps between the resume and job description, and generate actionable resume improvement suggestions.

Output a JSON object with these fields:
- gaps: array of gap objects, each with: gap (string), why_it_matters (string), evidence_from_jd (string), suggested_action (string), severity (critical/important/minor)
- gap_definitions: object mapping gap name to explanation
- evidence_from_jd: object mapping gap name to JD quote
- suggested_actions: array of specific actions
- confidence: float 0-1 overall confidence
- insufficient_evidence: array of gaps where evidence was weak

Focus on requirements explicitly stated in the JD. Do not invent requirements.
Be specific and evidence-based. Each gap must cite JD evidence.
"""

RESUME_SUGGESTION_PROMPT = """Based on the gap analysis above, generate specific resume bullet improvements.

For each gap, create a suggestion with:
- original: the current resume bullet or "N/A" if missing
- ai_suggestion: improved bullet incorporating JD keywords and evidence
- reason: why this change addresses the gap (cite JD evidence)
- confidence: float 0-1
- evidence_map: object with source (resume/jd) and section
- should_export: false (user must approve)

Only suggest improvements supported by actual resume content or JD requirements.
Do not invent experience, skills, or technologies not in the resume.
"""


class GapAnalysisSchema(BaseModel):
    """Schema for gap analysis output."""

    gaps: list = Field(
        default_factory=list,
        description="List of identified gaps",
    )
    gap_definitions: dict = Field(
        default_factory=dict,
        description="Why each gap matters",
    )
    evidence_from_jd: dict = Field(
        default_factory=dict,
        description="Evidence from job description for each gap"
    )
    suggested_actions: list = Field(
        default_factory=list,
        description="Suggested actions to address each gap",
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Overall confidence in gap identification"
    )
    insufficient_evidence: list = Field(
        default_factory=list,
        description="Gaps where evidence was insufficient",
    )
    mock_mode: bool = Field(
        default=False,
        description="Whether this result is from mock mode (not real AI analysis)"
    )


class ResumeSuggestionSchema(BaseModel):
    """Schema for resume suggestion output."""

    original: str = Field(
        "", description="Original resume content/bullet"
    )
    ai_suggestion: str = Field(
        "", description="AI-generated suggestion (based on confirmed evidence only)"
    )
    reason: str = Field(
        "", description="Why this suggestion was generated (evidence-based)"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Confidence in the suggestion"
    )
    evidence_map: dict = Field(
        default_factory=dict,
        description="Mapping of suggestion to source evidence"
    )
    should_export: bool = Field(
        default=False,
        description="Whether this suggestion should be included in export"
    )
    mock_mode: bool = Field(
        default=False,
        description="Whether this result is from mock mode (not real AI analysis)"
    )