"""Versioned prompt templates for extraction tasks."""

from pydantic import BaseModel


class ResumeExtractionSchema(BaseModel):
    """Schema for resume extraction output."""

    full_name: str = Field(..., "Full name as appears on resume")
    email: str = Field(..., "Email address")
    phone: str = Field("", "Phone number")
    location: str = Field("", "City, State")
    summary: str = Field("", "Professional summary or objective")
    skills: list = Field(default_factory=list, "Technical and soft skills")
    experience: list = Field(default_factory=list, "Work experience entries")
    education: list = Field(default_factory=list, "Degrees and certifications")
    projects: list = Field(default_factory=list, "Project entries")
    certifications: list = Field(default_factory=list, "Professional certifications")
    achievements: list = Field(default_factory=list, "Quantifiable achievements")
    confidence: float = Field(..., ge=0.0, le=1.0, "Confidence in extraction")
    evidence: dict = Field(
        default_factory=dict,
        "Mapping of field to source text spans and page numbers",
    )
    warnings: list = Field(
        default_factory=list,
        "List of fields where evidence was insufficient",
    )


class JobDescriptionExtractionSchema(BaseModel):
    """Schema for JD extraction output."""

    role_title: str = Field(..., "Primary job title")
    seniority: str = Field(
        ..., "Entry, Mid, Senior, Lead, Staff, Principal, etc."
    )
    industry: str = Field("", "Industry domain")
    required_skills: list = Field(
        default_factory=list, "Required technical and soft skills"
    )
    preferred_skills: list = Field(
        default_factory=list, "Preferred but not required skills"
    )
    responsibilities: list = Field(
        default_factory=list, "Key responsibilities"
    )
    education_requirements: list = Field(
        default_factory=list, "Required education"
    )
    certifications_required: list = Field(
        default_factory=list, "Required certifications"
    )
    keywords: list = Field(
        default_factory=list, "Important keywords and technologies"
    )
    experience_years: str = Field("", "Required years of experience")
    level_requirements: dict = Field(
        default_factory=dict,
        "Seniority-level specific requirements",
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence: dict = Field(
        default_factory=dict,
        "Mapping of field to source text and section references",
    )
    warnings: list = Field(
        default_factory=list,
        "Fields where parsing encountered difficulties",
    )