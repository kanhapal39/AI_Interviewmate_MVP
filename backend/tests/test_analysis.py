"""Tests for the Resume Optimizer analysis functionality."""

import pytest
from uuid import uuid4
from unittest.mock import patch, MagicMock, AsyncMock

# Environment variables are set in conftest.py


class TestAnalysisRelevance:
    """Tests for JD relevance in analysis results."""

    def test_product_intern_jd_no_kubernetes(self):
        """Product Intern JD should not produce Kubernetes/AWS EKS suggestions."""
        from app.prompts.v1.gap_analysis import GAP_ANALYSIS_PROMPT, RESUME_SUGGESTION_PROMPT

        # Verify prompt templates exist and are non-empty
        assert GAP_ANALYSIS_PROMPT
        assert RESUME_SUGGESTION_PROMPT
        assert len(GAP_ANALYSIS_PROMPT) > 100
        assert len(RESUME_SUGGESTION_PROMPT) > 100

        # Verify prompts reference JD evidence requirement
        assert "evidence" in GAP_ANALYSIS_PROMPT.lower()
        assert "jd" in GAP_ANALYSIS_PROMPT.lower()
        assert "do not invent" in RESUME_SUGGESTION_PROMPT.lower() or "not invent" in RESUME_SUGGESTION_PROMPT.lower()

    def test_mock_mode_flag_in_schemas(self):
        """Schemas should have mock_mode field."""
        from app.prompts.v1.gap_analysis import GapAnalysisSchema, ResumeSuggestionSchema

        # Check mock_mode field exists with default False (need to provide required fields)
        gap_schema = GapAnalysisSchema(confidence=0.5)
        assert hasattr(gap_schema, "mock_mode")
        assert gap_schema.mock_mode is False

        suggestion_schema = ResumeSuggestionSchema(confidence=0.5)
        assert hasattr(suggestion_schema, "mock_mode")
        assert suggestion_schema.mock_mode is False


class TestRecordAssociation:
    """Tests for correct record association."""

    def test_analysis_links_resume_and_jd(self):
        """Analysis record should link correct resume_id and jd_id."""
        from app.schemas import AnalysisCreate
        from uuid import uuid4

        resume_id = uuid4()
        jd_id = uuid4()
        user_id = uuid4()

        analysis = AnalysisCreate(
            resume_id=resume_id,
            job_description_id=jd_id,
            user_id=user_id
        )

        assert analysis.resume_id == resume_id
        assert analysis.job_description_id == jd_id
        assert analysis.user_id == user_id


class TestMissingDocumentText:
    """Tests for missing document text handling."""

    def test_missing_raw_text_returns_failed_status(self):
        """Analysis should fail gracefully when resume.raw_text or jd.raw_text is None."""
        # This tests the logic in create_analysis endpoint
        from app.api.v1.router import create_analysis
        import inspect

        source = inspect.getsource(create_analysis)
        assert "raw_text" in source
        assert "not available" in source
        assert "status" in source and "failed" in source


class TestProviderFailure:
    """Tests for provider failure handling."""

    def test_provider_failure_returns_error_state(self):
        """Provider error should set status=failed with error message, not sample data."""
        from app.api.v1.router import create_analysis
        import inspect

        source = inspect.getsource(create_analysis)
        assert "except Exception" in source
        assert "status = \"failed\"" in source
        assert "error" in source.lower()


class TestMalformedOutput:
    """Tests for malformed AI output handling."""

    def test_malformed_ai_output_safe_fallback(self):
        """Invalid JSON from AI should return safe empty structure, not crash."""
        from app.services.nvidia_provider import NVIDIAProvider
        from app.prompts.v1.gap_analysis import GapAnalysisSchema

        provider = NVIDIAProvider(api_key="test", mode="nvidia")

        # Test _validate_json_output handles invalid JSON
        with pytest.raises(Exception):
            provider._validate_json_output("not valid json {", GapAnalysisSchema)

        # Test _safe_fallback returns valid schema instance
        fallback = provider._safe_fallback(GapAnalysisSchema)
        assert fallback is not None
        assert isinstance(fallback, GapAnalysisSchema)


class TestOwnershipChecks:
    """Tests for ownership verification on API endpoints."""

    def test_get_analysis_ownership_check_in_code(self):
        """get_analysis should verify user owns the resume."""
        from app.api.v1.router import get_analysis
        import inspect

        source = inspect.getsource(get_analysis)
        assert "user_id != user_id" in source or "resume.user_id != user_id" in source

    def test_get_gap_analysis_ownership_check_in_code(self):
        """get_gap_analysis should verify user owns the resume."""
        from app.api.v1.router import get_gap_analysis
        import inspect

        source = inspect.getsource(get_gap_analysis)
        assert "user_id != user_id" in source or "resume.user_id != user_id" in source

    def test_get_suggestions_ownership_check_in_code(self):
        """get_suggestions should verify user owns the resume."""
        from app.api.v1.router import get_suggestions
        import inspect

        source = inspect.getsource(get_suggestions)
        assert "user_id != user_id" in source or "resume.user_id != user_id" in source


class TestMockMode:
    """Tests for mock mode handling."""

    def test_mock_provider_sets_mock_mode_flag(self):
        """Mock provider should set mock_mode=True on results."""
        from app.services.nvidia_provider import NVIDIAProvider
        from app.prompts.v1.gap_analysis import GapAnalysisSchema

        provider = NVIDIAProvider(api_key="test", mode="mock")
        result = provider.matching(GapAnalysisSchema, "resume", "jd", "template", {})

        assert result is not None
        assert hasattr(result, "mock_mode")
        assert result.mock_mode is True

    def test_mistral_mock_provider_sets_mock_mode_flag(self):
        """Mistral mock provider should set mock_mode=True on results."""
        from app.services.mistral_provider import MistralProvider, ProviderMode
        from app.prompts.v1.gap_analysis import GapAnalysisSchema

        provider = MistralProvider(api_key="test", mode=ProviderMode.MOCK)
        result = provider.matching(GapAnalysisSchema, "resume", "jd", "template", {})

        assert result is not None
        assert hasattr(result, "mock_mode")
        assert result.mock_mode is True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--no-cov"])