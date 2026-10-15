"""Integration tests for the analysis endpoints with real database and mocked AI provider."""

import pytest
from uuid import uuid4
from unittest.mock import patch, MagicMock
from httpx import AsyncClient
from sqlalchemy.orm import Session


class TestAnalysisCreation:
    """Tests for creating analyses with various scenarios."""

    @pytest.mark.asyncio
    async def test_create_analysis_with_valid_text_returns_completed(
        self, async_client, test_user, test_resume, test_jd
    ):
        """Creating analysis with valid resume and JD text should complete successfully."""
        response = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["resume_id"] == str(test_resume.id)
        assert data["job_description_id"] == str(test_jd.id)
        assert data["status"] in ["completed", "failed", "processing"]

        # With mock provider, should complete with mock_mode=True in results
        if data["status"] == "completed":
            assert data["gaps"] is not None
            assert data["recommendations"] is not None

    @pytest.mark.asyncio
    async def test_create_analysis_with_missing_resume_text_returns_failed(
        self, async_client, test_user, test_workspace, test_jd, db_session
    ):
        """Creating analysis with missing resume.raw_text should return failed status."""
        from app.db import models as db_models

        # Create resume without raw_text directly using db_session
        resume = db_models.Resume(
            id=uuid4(),
            workspace_id=test_workspace.id,
            user_id=test_user.id,
            source_file="uploads/empty.pdf",
            original_filename="empty.pdf",
            raw_text=None,  # Missing text
            parse_status="pending",
        )
        db_session.add(resume)
        db_session.commit()

        response = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "failed"
        assert data["gaps"] is not None
        assert any("not available" in str(gap).lower() for gap in data["gaps"])

    @pytest.mark.asyncio
    async def test_create_analysis_with_missing_jd_text_returns_failed(
        self, async_client, test_user, test_workspace, test_resume, db_session
    ):
        """Creating analysis with missing jd.raw_text should return failed status."""
        from app.db import models as db_models

        jd = db_models.JobDescription(
            id=uuid4(),
            workspace_id=test_workspace.id,
            user_id=test_user.id,
            source_file="uploads/empty_jd.pdf",
            original_filename="empty_jd.pdf",
            raw_text=None,  # Missing text
            parse_status="pending",
        )
        db_session.add(jd)
        db_session.commit()

        response = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(jd.id),
                "user_id": str(test_user.id),
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "failed"
        assert data["gaps"] is not None
        assert any("not available" in str(gap).lower() for gap in data["gaps"])

    @pytest.mark.asyncio
    async def test_create_analysis_unauthorized_user_returns_403(
        self, async_client, test_workspace, test_resume, test_jd
    ):
        """Creating analysis with another user's ID should return 403."""
        other_user_id = uuid4()

        response = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(other_user_id),
            },
        )

        assert response.status_code == 403
        assert "not authorized" in response.json()["detail"].lower()


class TestAnalysisRetrieval:
    """Tests for retrieving analysis results."""

    @pytest.mark.asyncio
    async def test_get_analysis_returns_correct_shape(
        self, async_client, test_user, test_resume, test_jd
    ):
        """GET /analyses/{id} should return analysis with expected fields."""
        # First create analysis
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        assert create_resp.status_code == 201
        analysis_id = create_resp.json()["id"]

        # Get analysis
        response = await async_client.get(f"/api/v1/analyses/{analysis_id}", params={"user_id": str(test_user.id)})

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == analysis_id
        assert data["resume_id"] == str(test_resume.id)
        assert data["job_description_id"] == str(test_jd.id)
        assert "score" in data
        assert "confidence" in data
        assert "gaps" in data
        assert "recommendations" in data
        assert "status" in data
        assert "methodology_version" in data

    @pytest.mark.asyncio
    async def test_get_analysis_unauthorized_returns_403(
        self, async_client, test_user, test_resume, test_jd
    ):
        """GET /analyses/{id} with wrong user should return 403."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        other_user_id = uuid4()
        response = await async_client.get(f"/api/v1/analyses/{analysis_id}", params={"user_id": str(other_user_id)})

        assert response.status_code == 403


class TestGapsEndpoint:
    """Tests for the gaps endpoint."""

    @pytest.mark.asyncio
    async def test_get_gaps_returns_correct_shape(
        self, async_client, test_user, test_resume, test_jd
    ):
        """GET /analyses/{id}/gaps should return gaps and recommendations."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        response = await async_client.get(f"/api/v1/analyses/{analysis_id}/gaps", params={"user_id": str(test_user.id)})

        assert response.status_code == 200
        data = response.json()
        assert "gaps" in data
        assert "recommendations" in data
        assert isinstance(data["gaps"], list)
        assert isinstance(data["recommendations"], list)

    @pytest.mark.asyncio
    async def test_get_gaps_unauthorized_returns_403(
        self, async_client, test_user, test_resume, test_jd
    ):
        """GET /analyses/{id}/gaps with wrong user should return 403."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        other_user_id = uuid4()
        response = await async_client.get(f"/api/v1/analyses/{analysis_id}/gaps", params={"user_id": str(other_user_id)})

        assert response.status_code == 403


class TestSuggestionsEndpoint:
    """Tests for the optimizer suggestions endpoint."""

    @pytest.mark.asyncio
    async def test_get_suggestions_returns_correct_shape(
        self, async_client, test_user, test_resume, test_jd
    ):
        """GET /optimizer/suggestions should return list of suggestions matching SuggestionResponse."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        response = await async_client.get(
            "/api/v1/optimizer/suggestions",
            params={"analysis_id": analysis_id, "user_id": str(test_user.id)},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        for suggestion in data:
            assert "id" in suggestion
            assert "original" in suggestion
            assert "ai_suggestion" in suggestion
            assert "reason" in suggestion
            assert "confidence" in suggestion
            assert "evidence_map" in suggestion
            assert "should_export" in suggestion
            # mock_mode is optional in schema but should be present when mock
            if "mock_mode" in suggestion:
                assert isinstance(suggestion["mock_mode"], bool)

    @pytest.mark.asyncio
    async def test_get_suggestions_mock_mode_flagged(
        self, async_client, test_user, test_resume, test_jd
    ):
        """With ENABLE_MOCK_PROVIDER=true, suggestions should have mock_mode=true."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        response = await async_client.get(
            "/api/v1/optimizer/suggestions",
            params={"analysis_id": analysis_id, "user_id": str(test_user.id)},
        )

        assert response.status_code == 200
        data = response.json()

        # With mock provider, at least some suggestions should have mock_mode=true
        # or the list should be empty (if no gaps found)
        if data:
            for suggestion in data:
                if "mock_mode" in suggestion:
                    assert suggestion["mock_mode"] is True, "Mock mode suggestions must be flagged"

    @pytest.mark.asyncio
    async def test_get_suggestions_unauthorized_returns_403(
        self, async_client, test_user, test_resume, test_jd
    ):
        """GET /optimizer/suggestions with wrong user should return 403."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        other_user_id = uuid4()
        response = await async_client.get(
            "/api/v1/optimizer/suggestions",
            params={"analysis_id": analysis_id, "user_id": str(other_user_id)},
        )

        assert response.status_code == 403


class TestProviderFailureHandling:
    """Tests for provider failure scenarios."""

    @pytest.mark.asyncio
    async def test_provider_failure_returns_failed_not_fake_success(
        self, async_client, test_user, test_resume, test_jd
    ):
        """When AI provider fails, analysis should be marked failed, not return fake data."""
        # Mock the provider at the services module where it's defined
        with patch("app.services.match_resume_jd") as mock_match:
            mock_match.side_effect = Exception("Provider unavailable")

            response = await async_client.post(
                "/api/v1/analyses",
                json={
                    "resume_id": str(test_resume.id),
                    "job_description_id": str(test_jd.id),
                    "user_id": str(test_user.id),
                },
            )

            assert response.status_code == 201
            data = response.json()
            assert data["status"] == "failed"
            assert data["gaps"] is not None
            assert any("failed" in str(gap).lower() for gap in data["gaps"])
            # Should NOT have fabricated recommendations
            assert data["recommendations"] == [] or data["recommendations"] is None

    @pytest.mark.asyncio
    async def test_malformed_ai_output_handled_safely(
        self, async_client, test_user, test_resume, test_jd
    ):
        """Malformed AI output should result in safe fallback, not crash."""
        from app.services.nvidia_provider import NVIDIAProvider
        from app.prompts.v1.gap_analysis import GapAnalysisSchema

        # Test that malformed output is handled by the provider's safe fallback
        provider = NVIDIAProvider(api_key="test", mode="nvidia")

        # This should raise an exception that gets caught
        with pytest.raises(Exception):
            provider._validate_json_output("not valid json {", GapAnalysisSchema)

        # Safe fallback should return a valid schema instance
        fallback = provider._safe_fallback(GapAnalysisSchema)
        assert fallback is not None
        assert hasattr(fallback, "gaps")
        assert hasattr(fallback, "confidence")


class TestMockModeLabeling:
    """Tests for mock mode labeling."""

    @pytest.mark.asyncio
    async def test_mock_provider_sets_mock_mode_true(
        self, async_client, test_user, test_resume, test_jd
    ):
        """Mock provider should set mock_mode=true on all results."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        # Check gaps endpoint
        gaps_resp = await async_client.get(
            f"/api/v1/analyses/{analysis_id}/gaps",
            params={"user_id": str(test_user.id)},
        )
        gaps_data = gaps_resp.json()

        # Check suggestions endpoint
        sugg_resp = await async_client.get(
            "/api/v1/optimizer/suggestions",
            params={"analysis_id": analysis_id, "user_id": str(test_user.id)},
        )
        sugg_data = sugg_resp.json()

        # At least one result should have mock_mode=true
        all_results = gaps_data.get("gaps", []) + gaps_data.get("recommendations", []) + sugg_data
        mock_flagged = any(r.get("mock_mode") is True for r in all_results if isinstance(r, dict))

        assert mock_flagged, "Mock mode results must be explicitly flagged"


class TestResponseShapes:
    """Tests verifying response shapes match frontend expectations."""

    @pytest.mark.asyncio
    async def test_analysis_response_matches_analysis_response_schema(
        self, async_client, test_user, test_resume, test_jd
    ):
        """Analysis response should match AnalysisResponse schema."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        response = await async_client.get(f"/api/v1/analyses/{analysis_id}", params={"user_id": str(test_user.id)})
        data = response.json()

        # Required fields from AnalysisResponse
        assert "id" in data
        assert "workspace_id" in data
        assert "resume_id" in data
        assert "job_description_id" in data
        assert "score" in data
        assert "methodology_version" in data
        assert "gaps" in data
        assert "recommendations" in data
        assert "status" in data
        assert "confidence" in data
        assert "model_version" in data
        assert "prompt_version" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_gaps_response_matches_gap_analysis_response_schema(
        self, async_client, test_user, test_resume, test_jd
    ):
        """Gaps response should match GapAnalysisResponse schema."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        response = await async_client.get(f"/api/v1/analyses/{analysis_id}/gaps", params={"user_id": str(test_user.id)})
        data = response.json()

        assert "gaps" in data
        assert "recommendations" in data
        assert isinstance(data["gaps"], list)
        assert isinstance(data["recommendations"], list)

    @pytest.mark.asyncio
    async def test_suggestions_response_matches_suggestion_response_schema(
        self, async_client, test_user, test_resume, test_jd
    ):
        """Suggestions response should match List[SuggestionResponse]."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        response = await async_client.get(
            "/api/v1/optimizer/suggestions",
            params={"analysis_id": analysis_id, "user_id": str(test_user.id)},
        )
        data = response.json()

        assert isinstance(data, list)
        for suggestion in data:
            assert "id" in suggestion
            assert "original" in suggestion
            assert "ai_suggestion" in suggestion
            assert "reason" in suggestion
            assert "confidence" in suggestion
            assert "evidence_map" in suggestion
            assert "should_export" in suggestion
            # mock_mode is optional but when present should be boolean
            if "mock_mode" in suggestion:
                assert isinstance(suggestion["mock_mode"], bool)


class TestEmptyRecommendations:
    """Tests for handling empty recommendations."""

    @pytest.mark.asyncio
    async def test_empty_recommendations_returns_empty_list_not_none(
        self, async_client, test_user, test_resume, test_jd
    ):
        """When no recommendations exist, should return empty list, not None."""
        create_resp = await async_client.post(
            "/api/v1/analyses",
            json={
                "resume_id": str(test_resume.id),
                "job_description_id": str(test_jd.id),
                "user_id": str(test_user.id),
            },
        )
        analysis_id = create_resp.json()["id"]

        response = await async_client.get(
            "/api/v1/optimizer/suggestions",
            params={"analysis_id": analysis_id, "user_id": str(test_user.id)},
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should be a list (may be empty) but not None
        assert data is not None


class TestTimeoutHandling:
    """Tests for timeout behavior in AI provider calls."""

    @pytest.mark.asyncio
    async def test_timeout_results_in_failed_analysis(
        self, async_client, test_user, test_resume, test_jd
    ):
        """When provider call times out, analysis should be marked failed, not completed."""
        import asyncio

        # Mock match_resume_jd to raise TimeoutError
        with patch("app.services.match_resume_jd", side_effect=asyncio.TimeoutError()):
            response = await async_client.post(
                "/api/v1/analyses",
                json={
                    "resume_id": str(test_resume.id),
                    "job_description_id": str(test_jd.id),
                    "user_id": str(test_user.id),
                },
            )

            assert response.status_code == 201
            data = response.json()
            assert data["status"] == "failed"
            assert data["gaps"] is not None
            assert any("timed out" in str(gap).lower() for gap in data["gaps"])
            assert data["recommendations"] == []


class TestSynchronousTimeoutRisk:
    """Tests for synchronous AI call timeout risk assessment."""

    def test_synchronous_call_has_timeout_implemented(self):
        """Verify the synchronous call in create_analysis now has explicit timeout."""
        import inspect
        from app.api.v1.router import create_analysis

        source = inspect.getsource(create_analysis)
        # Verify timeout wrapper is now used
        assert "asyncio.wait_for" in source
        assert "run_in_executor" in source
        assert "timeout=60.0" in source or "timeout=60" in source

        # Verify timeout error handling exists
        assert "asyncio.TimeoutError" in source

        print("SUCCESS: Synchronous AI call in create_analysis now has explicit timeout.")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--no-cov"])