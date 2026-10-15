"""NVIDIA AI provider abstraction with structured output, retries, and mock mode.

Uses NVIDIA's OpenAI-compatible API at https://integrate.api.nvidia.com/v1
"""

import json
import time
import logging
from typing import Any, Dict, Optional, Type

import httpx
from pydantic import BaseModel, ValidationError as PydanticValidationError

from app.core.config import settings

logger = logging.getLogger(__name__)


class ProviderMode(str):
    """AI provider operation mode."""
    NVIDIA = "nvidia"
    MISTRAL = "mistral"
    MOCK = "mock"


class ProviderError(Exception):
    """Base provider error."""
    pass


class ProviderTimeoutError(ProviderError):
    """Raised when the provider times out."""
    pass


class ProviderRateLimitError(ProviderError):
    """Raised when rate limited."""
    pass


class SchemaValidationError(ProviderError):
    """Raised when output schema validation fails."""
    pass


class ModelResponse(BaseModel):
    """Wrapped NVIDIA API response with metadata."""

    content: str = ""
    json: Optional[Dict[str, Any]] = None
    usage: Optional[Dict[str, Any]] = None
    model: str = ""
    finish_reason: str = ""
    prompt_version: str = ""
    latency_ms: int = 0
    cost_estimate: float = 0.0


class MockResponse(ModelResponse):
    """Mock response for development/test mode."""

    json: Dict[str, Any]


def _mock_json(data: Dict[str, Any], latency_ms: int = 50) -> ModelResponse:
    """Create a mock response from a dict."""
    return MockResponse(
        json=data,
        model=settings.NVIDIA_MODEL,
        latency_ms=latency_ms,
        cost_estimate=0.0,
        prompt_version="mock-v1",
    )


class NVIDIAProvider:
    """
    Server-side NVIDIA provider with:
    - Timeouts and retries with exponential backoff
    - Structured JSON output validated against schemas
    - Model selection by task
    - Token/context budget enforcement
    - Error mapping to safe user states
    - Request/response metadata tracking
    - No API key exposure in logs or client bundles
    """

    def __init__(
        self,
        api_key: str,
        mode: str = ProviderMode.NVIDIA,
        timeout: float = 30.0,
        max_retries: int = 3,
    ):
        self.api_key = api_key
        self.mode = mode
        self.timeout = timeout
        self.max_retries = max_retries
        self.base_url = settings.NVIDIA_BASE_URL
        self.model = settings.NVIDIA_MODEL
        self.client = httpx.Client(
            base_url=self.base_url,
            timeout=self.timeout,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )

    def _map_error(self, error: Exception) -> ProviderError:
        """Map HTTP/API errors to application errors."""
        if isinstance(error, httpx.TimeoutException):
            return ProviderTimeoutError(f"Request timed out after {self.timeout}s")
        if isinstance(error, httpx.HTTPStatusError):
            status = error.response.status_code if error.response else None
            if status == 429:
                return ProviderRateLimitError("Rate limited by NVIDIA API")
            if status and status >= 500:
                return ProviderError(f"NVIDIA API server error: {status}")
            if status == 401:
                return ProviderError("Invalid NVIDIA API key")
        return ProviderError(str(error))

    def _request(
        self,
        method: str,
        endpoint: str,
        json_payload: Dict[str, Any],
        retry_count: Optional[int] = None,
    ) -> ModelResponse:
        """Execute a request with retries and exponential backoff."""
        retry_count = retry_count or self.max_retries
        last_error = None

        for attempt in range(retry_count + 1):
            try:
                start = time.time()
                response = self.client.request(
                    method, endpoint, json=json_payload
                )
                latency_ms = int((time.time() - start) * 1000)

                response.raise_for_status()
                data = response.json()

                return ModelResponse(
                    content=data.get("choices", [{}])[0].get("message", {}).get(
                        "content", ""
                    ),
                    json=data.get("choices", [{}])[0].get("message", {}).get(
                        "json", None
                    ),
                    usage=data.get("usage", {}),
                    model=data.get("model", ""),
                    finish_reason=data.get("choices", [{}])[0].get("finish_reason", ""),
                    prompt_version=data.get("prompt_version", ""),
                    latency_ms=latency_ms,
                    cost_estimate=self._estimate_cost(data),
                )

            except Exception as e:
                last_error = self._map_error(e)
                if attempt < retry_count:
                    backoff = 2 ** attempt
                    logger.warning(
                        f"Request attempt {attempt + 1} failed: {last_error}. "
                        f"Backing off {backoff}s..."
                    )
                    time.sleep(backoff)
                else:
                    logger.error(
                        f"All {retry_count + 1} attempts failed: {last_error}"
                    )

        raise last_error

    def _estimate_cost(self, response: Dict[str, Any]) -> float:
        """Estimate cost from response usage metadata."""
        usage = response.get("usage", {})
        if not usage:
            return 0.0
        # NVIDIA pricing varies by model - placeholder estimation
        input_tokens = usage.get("prompt_tokens", 0)
        output_tokens = usage.get("completion_tokens", 0)
        cost = (input_tokens * 0.000001) + (output_tokens * 0.000002)
        return round(cost, 6)

    def _validate_json_output(
        self, raw_output: Any, schema: Type[BaseModel]
    ) -> BaseModel:
        """Validate and coerce model output against a Pydantic schema."""
        if isinstance(raw_output, BaseModel):
            return raw_output

        if isinstance(raw_output, dict):
            try:
                return schema(**raw_output)
            except PydanticValidationError as e:
                logger.warning(f"Schema validation failed: {e}")
                raise SchemaValidationError(f"Model output does not match expected schema: {e}")

        if isinstance(raw_output, str):
            try:
                parsed = json.loads(raw_output)
                return self._validate_json_output(parsed, schema)
            except json.JSONDecodeError as e:
                logger.warning(f"Model output is not valid JSON: {e}")
                raise SchemaValidationError(
                    "Model output is not valid JSON and cannot be parsed into schema"
                )

        raise SchemaValidationError(f"Unsupported output type: {type(raw_output)}")

    def _safe_fallback(
        self, schema: Type[BaseModel]
    ) -> Optional[BaseModel]:
        """Return a safe fallback when model output cannot be validated."""
        try:
            from pydantic_core import PydanticUndefined
            # Build defaults for all fields
            defaults = {}
            if hasattr(schema, "model_fields"):
                # Pydantic v2
                for field_name, field_info in schema.model_fields.items():
                    if field_info.default is not None and field_info.default is not PydanticUndefined:
                        defaults[field_name] = field_info.default
                    elif field_info.default_factory is not None:
                        defaults[field_name] = field_info.default_factory()
                    else:
                        # Provide sensible defaults based on type annotation
                        annotation = field_info.annotation
                        if annotation is str:
                            defaults[field_name] = ""
                        elif annotation is int:
                            defaults[field_name] = 0
                        elif annotation is float:
                            defaults[field_name] = 0.0
                        elif annotation is bool:
                            defaults[field_name] = False
                        elif annotation is list:
                            defaults[field_name] = []
                        elif annotation is dict:
                            defaults[field_name] = {}
            elif hasattr(schema, "__fields__"):
                # Pydantic v1
                for field_name, field_info in schema.__fields__.items():
                    if field_info.default is not None:
                        defaults[field_name] = field_info.default
                    elif field_info.default_factory is not None:
                        defaults[field_name] = field_info.default_factory()

            # In mock mode, provide test data with mock_mode flag
            if self.mode == ProviderMode.MOCK:
                schema_name = schema.__name__
                if schema_name == "GapAnalysisSchema":
                    defaults.update({
                        "gaps": [{
                            "gap": "Test gap - missing Kubernetes experience",
                            "why_it_matters": "Required for container orchestration",
                            "evidence_from_jd": "Must have experience with Kubernetes orchestration",
                            "suggested_action": "Add Kubernetes projects to resume",
                            "severity": "critical",
                            "mock_mode": True
                        }],
                        "gap_definitions": {"Test gap": "Missing Kubernetes experience"},
                        "evidence_from_jd": {"Test gap": "Must have experience with Kubernetes orchestration"},
                        "suggested_actions": ["Add Kubernetes projects to resume"],
                        "confidence": 0.85,
                        "insufficient_evidence": [],
                        "mock_mode": True
                    })
                elif schema_name == "ResumeSuggestionSchema":
                    defaults.update({
                        "original": "Built microservices using Docker",
                        "ai_suggestion": "Built and deployed microservices using Docker and Kubernetes on AWS EKS",
                        "reason": "JD requires Kubernetes orchestration experience",
                        "confidence": 0.85,
                        "evidence_map": {"source": "jd", "section": "requirements"},
                        "should_export": False,
                        "mock_mode": True
                    })

            return schema(**defaults)
        except Exception:
            return None

    def extraction(
        self,
        schema: Type[BaseModel],
        context: str,
        prompt_template: str,
        variables: Dict[str, Any],
    ) -> Optional[BaseModel]:
        """Extract structured data from context (resume, JD, etc.)."""
        if self.mode == ProviderMode.MOCK:
            return self._safe_fallback(schema)

        prompt = prompt_template.format(**variables, context=context)

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0,
            "max_tokens": min(
                settings.MAX_TOKENS_PER_REQUEST, 4096
            ),
            "response_format": {"type": "json_object"},
        }

        response = self._request("POST", "/chat/completions", payload)

        try:
            content = response.json or response.content
            if isinstance(content, str):
                parsed = json.loads(content)
            else:
                parsed = content

            return self._validate_json_output(parsed, schema)
        except (SchemaValidationError, json.JSONDecodeError) as e:
            logger.error(f"Extraction schema validation failed: {e}")
            return self._safe_fallback(schema)

    def matching(
        self,
        schema: Type[BaseModel],
        resume_context: str,
        jd_context: str,
        prompt_template: str,
        variables: Dict[str, Any],
    ) -> Optional[BaseModel]:
        """Perform resume-JD matching or skill categorization."""
        if self.mode == ProviderMode.MOCK:
            result = self._safe_fallback(schema)
            if result and hasattr(result, 'mock_mode'):
                result.mock_mode = True
            return result

        prompt = prompt_template.format(
            resume_context=resume_context, jd_context=jd_context, **variables
        )

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0,
            "max_tokens": min(settings.MAX_TOKENS_PER_REQUEST, 4096),
            "response_format": {"type": "json_object"},
        }

        response = self._request("POST", "/chat/completions", payload)

        try:
            content = response.json or response.content
            if isinstance(content, str):
                parsed = json.loads(content)
            else:
                parsed = content

            return self._validate_json_output(parsed, schema)
        except (SchemaValidationError, json.JSONDecodeError) as e:
            logger.error(f"Matching schema validation failed: {e}")
            return self._safe_fallback(schema)

    def rewriting(
        self,
        schema: Type[BaseModel],
        source_text: str,
        prompt_template: str,
        variables: Dict[str, Any],
    ) -> Optional[BaseModel]:
        """Rewrite/resume optimization text."""
        if self.mode == ProviderMode.MOCK:
            return self._safe_fallback(schema)

        prompt = prompt_template.format(
            source_text=source_text, **variables
        )

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": min(settings.MAX_TOKENS_PER_REQUEST, 4096),
            "response_format": {"type": "json_object"},
        }

        response = self._request("POST", "/chat/completions", payload)

        try:
            content = response.json or response.content
            if isinstance(content, str):
                parsed = json.loads(content)
            else:
                parsed = content

            return self._validate_json_output(parsed, schema)
        except (SchemaValidationError, json.JSONDecodeError) as e:
            logger.error(f"Rewriting schema validation failed: {e}")
            return self._safe_fallback(schema)

    def question_generation(
        self,
        schema: Type[BaseModel],
        resume_summary: str,
        jd_summary: str,
        target_role: str,
        interview_round: str,
        difficulty: str,
        prompt_template: str,
        variables: Dict[str, Any],
    ) -> Optional[BaseModel]:
        """Generate interview questions."""
        if self.mode == ProviderMode.MOCK:
            return self._safe_fallback(schema)

        prompt = prompt_template.format(
            resume_summary=resume_summary,
            jd_summary=jd_summary,
            target_role=target_role,
            interview_round=interview_round,
            difficulty=difficulty,
            **variables,
        )

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": min(settings.MAX_TOKENS_PER_REQUEST, 4096),
            "response_format": {"type": "json_object"},
        }

        response = self._request("POST", "/chat/completions", payload)

        try:
            content = response.json or response.content
            if isinstance(content, str):
                parsed = json.loads(content)
            else:
                parsed = content

            return self._validate_json_output(parsed, schema)
        except (SchemaValidationError, json.JSONDecodeError) as e:
            logger.error(f"Question generation schema validation failed: {e}")
            return self._safe_fallback(schema)

    def answer_evaluation(
        self,
        schema: Type[BaseModel],
        question: str,
        answer: str,
        rubric: Dict[str, Any],
        prompt_template: str,
        variables: Dict[str, Any],
    ) -> Optional[BaseModel]:
        """Evaluate interview answer against rubric."""
        if self.mode == ProviderMode.MOCK:
            return self._safe_fallback(schema)

        prompt = prompt_template.format(
            question=question, answer=answer, rubric=rubric, **variables
        )

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0,
            "max_tokens": min(settings.MAX_TOKENS_PER_REQUEST, 4096),
            "response_format": {"type": "json_object"},
        }

        response = self._request("POST", "/chat/completions", payload)

        try:
            content = response.json or response.content
            if isinstance(content, str):
                parsed = json.loads(content)
            else:
                parsed = content

            return self._validate_json_output(parsed, schema)
        except (SchemaValidationError, json.JSONDecodeError) as e:
            logger.error(f"Answer evaluation schema validation failed: {e}")
            return self._safe_fallback(schema)


# Factory function
def get_nvidia_provider(
    mode: Optional[str] = None,
) -> NVIDIAProvider:
    """Get a configured NVIDIAProvider instance."""
    mode = mode or (
        ProviderMode.MOCK
        if not settings.NVIDIA_API_KEY or settings.ENABLE_MOCK_PROVIDER
        else ProviderMode.NVIDIA
    )

    api_key = settings.NVIDIA_API_KEY or "mock-key-for-testing"
    return NVIDIAProvider(api_key=api_key, mode=mode)


# Convenience functions for common tasks
def extract_structured(
    schema: Type[BaseModel],
    context: str,
    prompt_template: str,
    variables: Dict[str, Any],
    mode: Optional[str] = None,
) -> Optional[BaseModel]:
    """Extract structured data using the provider."""
    provider = get_nvidia_provider(mode)
    return provider.extraction(schema, context, prompt_template, variables)


def match_resume_jd(
    schema: Type[BaseModel],
    resume_context: str,
    jd_context: str,
    prompt_template: str,
    variables: Dict[str, Any],
    mode: Optional[str] = None,
) -> Optional[BaseModel]:
    """Match resume against JD using the provider."""
    provider = get_nvidia_provider(mode)
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
    """Generate interview questions."""
    provider = get_nvidia_provider(mode)
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
    """Evaluate interview answer."""
    provider = get_nvidia_provider(mode)
    return provider.answer_evaluation(schema, question, answer, rubric, prompt_template, variables)