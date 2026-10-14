"""Services package - unified AI provider interface."""

from typing import Any, Dict, Optional, Type
from app.core.config import settings
from pydantic import BaseModel

# Import both providers
from app.services.nvidia_provider import (
    NVIDIAProvider,
    get_nvidia_provider,
    extract_structured as nvidia_extract,
    match_resume_jd as nvidia_match,
    generate_questions as nvidia_generate,
    evaluate_answer as nvidia_evaluate,
)
from app.services.mistral_provider import (
    MistralProvider,
    get_provider as get_mistral_provider,
    extract_structured as mistral_extract,
    match_resume_jd as mistral_match,
    generate_questions as mistral_generate,
    evaluate_answer as mistral_evaluate,
)

# Unified provider interface
class ProviderMode:
    NVIDIA = "nvidia"
    MISTRAL = "mistral"
    MOCK = "mock"


def get_provider(mode: Optional[str] = None):
    """Get the configured AI provider instance based on settings."""
    ai_provider = settings.AI_PROVIDER.lower()
    
    if ai_provider == "nvidia":
        return get_nvidia_provider(mode)
    elif ai_provider == "mistral":
        return get_mistral_provider(mode)
    else:  # mock
        # Return NVIDIA provider in mock mode (works without API key)
        return get_nvidia_provider(ProviderMode.MOCK)


# Convenience functions that use the configured provider
def extract_structured(
    schema: Type[BaseModel],
    context: str,
    prompt_template: str,
    variables: Dict[str, Any],
    mode: Optional[str] = None,
) -> Optional[BaseModel]:
    """Extract structured data using the configured provider."""
    provider = get_provider(mode)
    return provider.extraction(schema, context, prompt_template, variables)


def match_resume_jd(
    schema: Type[BaseModel],
    resume_context: str,
    jd_context: str,
    prompt_template: str,
    variables: Dict[str, Any],
    mode: Optional[str] = None,
) -> Optional[BaseModel]:
    """Match resume against JD using the configured provider."""
    provider = get_provider(mode)
    return provider.matching(schema, resume_context, jd_context, prompt_template, variables)


def generate_questions(
    schema: Type[BaseModel],
    resume_summary: str,
    jd_summary: str,
    target_role: str,
    interview_round: str,
    difficulty: str,
    prompt_template: str,
    variables: Dict[str, Any],
    mode: Optional[str] = None,
) -> Optional[BaseModel]:
    """Generate interview questions using the configured provider."""
    provider = get_provider(mode)
    return provider.question_generation(
        schema, resume_summary, jd_summary, target_role, interview_round, difficulty,
        prompt_template, variables,
    )


def evaluate_answer(
    schema: Type[BaseModel],
    question: str,
    answer: str,
    rubric: Dict[str, Any],
    prompt_template: str,
    variables: Dict[str, Any],
    mode: Optional[str] = None,
) -> Optional[BaseModel]:
    """Evaluate interview answer using the configured provider."""
    provider = get_provider(mode)
    return provider.answer_evaluation(schema, question, answer, rubric, prompt_template, variables)