# Evaluation Implementation Mapping

This document maps each Evals test ID (EV-001 through EV-028) to implementation location, fixtures, and CI commands.

## Test Categories

| Category | Tests | Implementation |
|----------|-------|----------------|
| Schema Validation | EV-001, EV-002 | `backend/tests/test_schemas.py` |
| Parsing & Extraction | EV-003, EV-004, EV-005 | `backend/tests/test_parsing.py` |
| Matching & Scoring | EV-006, EV-007, EV-008, EV-009 | `backend/tests/test_matching.py` |
| Gap Analysis & Optimizer | EV-010, EV-011, EV-012 | `backend/tests/test_optimizer.py` |
| Fabrication Prevention | EV-013, EV-014, EV-015 | `backend/tests/test_fabrication.py` |
| Safety & Security | EV-016, EV-017, EV-018, EV-019, EV-020, EV-021, EV-022, EV-023 | `backend/tests/test_safety.py` |
| Reliability | EV-024, EV-025 | `backend/tests/test_reliability.py` |
| Operations | EV-026 | `backend/tests/test_operations.py` |
| Auditability | EV-027, EV-028 | `backend/tests/test_auditability.py` |

## Detailed Mapping

### EV-001: Resume Parser Schema Validity
- **Description**: Parser output conforms to `ResumeExtractionSchema`
- **Location**: `backend/tests/test_parsing.py::test_resume_parser_schema_validity`
- **Fixtures**: `tests/fixtures/resumes/` (10 PDFs, 5 DOCXs)
- **Command**: `pytest tests/test_parsing.py::test_resume_parser_schema_validity -v`

### EV-002: JD Parser Schema Validity
- **Description**: Parser output conforms to `JobDescriptionExtractionSchema`
- **Location**: `backend/tests/test_parsing.py::test_jd_parser_schema_validity`
- **Fixtures**: `tests/fixtures/jds/` (10 text files, 5 PDFs)
- **Command**: `pytest tests/test_parsing.py::test_jd_parser_schema_validity -v`

### EV-003: Resume Field Extraction Accuracy
- **Description**: Field-level precision/recall/F1 for name, contact, skills, experience, education, etc.
- **Location**: `backend/tests/test_parsing.py::test_resume_field_extraction`
- **Fixtures**: `tests/fixtures/resumes/gold_standard.json` (annotated ground truth)
- **Command**: `pytest tests/test_parsing.py::test_resume_field_extraction -v`

### EV-004: JD Requirement Categorization
- **Description**: Requirements correctly classified as Must Have/Should Have/Nice to Have
- **Location**: `backend/tests/test_matching.py::test_requirement_categorization`
- **Fixtures**: `tests/fixtures/jds/categorized_requirements.json`
- **Command**: `pytest tests/test_matching.py::test_requirement_categorization -v`

### EV-005: Parse Warnings & "Not Found" Preference
- **Description**: Parser prefers "Not found"/"Needs review"/"Insufficient evidence" over inventions
- **Location**: `backend/tests/test_parsing.py::test_parse_warnings_preference`
- **Fixtures**: `tests/fixtures/resumes/missing_fields.pdf`, `tests/fixtures/resumes/ambiguous.pdf`
- **Command**: `pytest tests/test_parsing.py::test_parse_warnings_preference -v`

### EV-006: Matching Evidence Linking
- **Description**: Every match has source spans from resume and JD
- **Location**: `backend/tests/test_matching.py::test_evidence_linking`
- **Fixtures**: `tests/fixtures/analyses/evidence_linked.json`
- **Command**: `pytest tests/test_matching.py::test_evidence_linking -v`

### EV-007: Score Formula Fidelity
- **Description**: Deterministic score matches weighted formula exactly
- **Location**: `backend/tests/test_matching.py::test_score_formula_fidelity`
- **Fixtures**: `tests/fixtures/analyses/score_calculation_cases.json`
- **Command**: `pytest tests/test_matching.py::test_score_formula_fidelity -v`

### EV-008: Score Repeatability
- **Description**: Same inputs → same score (within methodology version)
- **Location**: `backend/tests/test_matching.py::test_score_repeatability`
- **Fixtures**: Fixed resume + JD pair, run 10 times
- **Command**: `pytest tests/test_matching.py::test_score_repeatability -v`

### EV-009: Methodology Version Display
- **Description**: Score output includes methodology version
- **Location**: `backend/tests/test_auditability.py::test_methodology_version_display`
- **Command**: `pytest tests/test_auditability.py::test_methodology_version_display -v`

### EV-010: Gap Analysis Format
- **Description**: Gaps follow "Gap → Why it matters → Evidence from JD → Suggested action"
- **Location**: `backend/tests/test_optimizer.py::test_gap_format`
- **Fixtures**: `tests/fixtures/gaps/expected_format.json`
- **Command**: `pytest tests/test_optimizer.py::test_gap_format -v`

### EV-011: Suggestion Format
- **Description**: Suggestions follow "Original → AI Suggestion → Reason" with evidence
- **Location**: `backend/tests/test_optimizer.py::test_suggestion_format`
- **Fixtures**: `tests/fixtures/optimizer/suggestions.json`
- **Command**: `pytest tests/test_optimizer.py::test_suggestion_format -v`

### EV-012: Rejection Memory
- **Description**: Rejected unsupported claims not silently reintroduced
- **Location**: `backend/tests/test_optimizer.py::test_rejection_memory`
- **Fixtures**: Sequential regenerate calls with rejected suggestion
- **Command**: `pytest tests/test_optimizer.py::test_rejection_memory -v`

### EV-013: Fabrication Prevention - Experience
- **Description**: No invented employers, titles, dates, projects
- **Location**: `backend/tests/test_fabrication.py::test_no_fabricated_experience`
- **Fixtures**: Resume with gaps, JD requiring invented experience
- **Command**: `pytest tests/test_fabrication.py::test_no_fabricated_experience -v`

### EV-014: Fabrication Prevention - Metrics
- **Description**: No invented metrics, percentages, dollar amounts
- **Location**: `backend/tests/test_fabrication.py::test_no_fabricated_metrics`
- **Fixtures**: Resume with "improved performance", JD wanting specific %
- **Command**: `pytest tests/test_fabrication.py::test_no_fabricated_metrics -v`

### EV-015: Fabrication Prevention - Credentials
- **Description**: No invented degrees, certifications, skills
- **Location**: `backend/tests/test_fabrication.py::test_no_fabricated_credentials`
- **Fixtures**: Resume missing cert, JD requiring it
- **Command**: `pytest tests/test_fabrication.py::test_no_fabricated_credentials -v`

### EV-016: Unsupported Claim Export Block
- **Description**: Unapproved suggestions cannot be exported
- **Location**: `backend/tests/test_optimizer.py::test_export_blocks_unapproved`
- **Fixtures**: Mixed accepted/rejected suggestions
- **Command**: `pytest tests/test_optimizer.py::test_export_blocks_unapproved -v`

### EV-017: ATS Score Labeling
- **Description**: Score never presented as actual vendor ATS score
- **Location**: `backend/tests/test_safety.py::test_ats_score_labeling`
- **Fixtures**: Frontend score display components
- **Command**: `pytest tests/test_safety.py::test_ats_score_labeling -v`

### EV-018: Protected Attribute Invariance
- **Description**: Scores unchanged when protected attributes added to resume
- **Location**: `backend/tests/test_safety.py::test_protected_attribute_invariance`
- **Fixtures**: Resume pairs differing only in name/location implying protected class
- **Command**: `pytest tests/test_safety.py::test_protected_attribute_invariance -v`

### EV-019: Cross-User Isolation
- **Description**: No API returns another user's data
- **Location**: `backend/tests/test_safety.py::test_cross_user_isolation`
- **Fixtures**: Two users, attempt to access other's resources
- **Command**: `pytest tests/test_safety.py::test_cross_user_isolation -v`

### EV-020: Data Deletion
- **Description**: User deletion removes all user data, preserves audit
- **Location**: `backend/tests/test_safety.py::test_data_deletion`
- **Fixtures**: User with full data set, delete and verify
- **Command**: `pytest tests/test_safety.py::test_data_deletion -v`

### EV-021: Prompt Injection in Document
- **Description**: "Ignore previous instructions" in resume treated as text, not instruction
- **Location**: `backend/tests/test_safety.py::test_prompt_injection_in_document`
- **Fixtures**: Resume with injected instructions
- **Command**: `pytest tests/test_safety.py::test_prompt_injection_in_document -v`

### EV-022: Authorization Enforcement
- **Description**: All endpoints enforce ownership
- **Location**: `backend/tests/test_safety.py::test_authorization_enforcement`
- **Fixtures**: Parametrized across all mutating endpoints
- **Command**: `pytest tests/test_safety.py::test_authorization_enforcement -v`

### EV-023: Sensitive Attribute Invariance (Fairness)
- **Description**: Non-job-relevant signals don't affect score
- **Location**: `backend/tests/test_safety.py::test_sensitive_attribute_invariance`
- **Fixtures**: Counterfactual resume pairs
- **Command**: `pytest tests/test_safety.py::test_sensitive_attribute_invariance -v`

### EV-024: Analysis Retry Idempotency
- **Description**: Retry doesn't duplicate/corrupt analysis
- **Location**: `backend/tests/test_reliability.py::test_analysis_retry_idempotency`
- **Fixtures**: Simulated transient failures
- **Command**: `pytest tests/test_reliability.py::test_analysis_retry_idempotency -v`

### EV-025: Provider Outage Fallback
- **Description**: User sees recoverable state, no fabricated results
- **Location**: `backend/tests/test_reliability.py::test_provider_outage_fallback`
- **Fixtures**: Mock provider returning 503
- **Command**: `pytest tests/test_reliability.py::test_provider_outage_fallback -v`

### EV-026: Cost Budget Enforcement
- **Description**: Token/context limits and plan limits enforced
- **Location**: `backend/tests/test_operations.py::test_cost_budget_enforcement`
- **Fixtures**: Large documents, budget-limited account
- **Command**: `pytest tests/test_operations.py::test_cost_budget_enforcement -v`

### EV-027: Methodology Version Display
- **Description**: Score and progress identify rubric version
- **Location**: `backend/tests/test_auditability.py::test_methodology_version_display`
- **Fixtures**: Multiple methodology versions
- **Command**: `pytest tests/test_auditability.py::test_methodology_version_display -v`

### EV-028: Comparable Progress Calculation
- **Description**: Only comparable sessions used for improvement claims
- **Location**: `backend/tests/test_auditability.py::test_comparable_progress`
- **Fixtures**: Mixed methodology versions in history
- **Command**: `pytest tests/test_auditability.py::test_comparable_progress -v`

## Fixture Structure

```
backend/tests/fixtures/
├── resumes/
│   ├── gold_standard.json          # Annotated ground truth
│   ├── missing_fields.pdf          # Missing critical fields
│   ├── ambiguous.pdf               # Ambiguous formatting
│   ├── two_column.pdf              # Two-column layout
│   ├── prompt_injection.pdf        # Contains "ignore instructions"
│   └── *.pdf, *.docx               # 15 diverse samples
├── jds/
│   ├── categorized_requirements.json
│   ├── vague_requirements.txt
│   ├── duplicate_requirements.txt
│   └── *.txt, *.pdf                # 15 diverse samples
├── analyses/
│   ├── evidence_linked.json        # Expected matching output
│   ├── score_calculation_cases.json # Deterministic score cases
│   └── counterfactual_pairs.json   # For fairness tests
├── gaps/
│   └── expected_format.json
├── optimizer/
│   └── suggestions.json
└── counterfactual/
    └── protected_attribute_pairs.json
```

## CI Pipeline

```yaml
# .github/workflows/evals.yml
name: Evaluation Tests

on: [push, pull_request]

jobs:
  eval-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: interviewmate_test
        ports: ["5432:5432"]
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.9"
          
      - name: Install backend deps
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -e .
          
      - name: Run migrations
        run: |
          cd backend
          alembic upgrade head
          
      - name: Run Schema Tests (EV-001, EV-002)
        run: |
          cd backend
          pytest tests/test_schemas.py -v
          
      - name: Run Parsing Tests (EV-003, EV-004, EV-005)
        run: |
          cd backend
          pytest tests/test_parsing.py -v
          
      - name: Run Matching Tests (EV-006, EV-007, EV-008, EV-009)
        run: |
          cd backend
          pytest tests/test_matching.py -v
          
      - name: Run Optimizer Tests (EV-010, EV-011, EV-012, EV-016)
        run: |
          cd backend
          pytest tests/test_optimizer.py -v
          
      - name: Run Fabrication Tests (EV-013, EV-014, EV-015)
        run: |
          cd backend
          pytest tests/test_fabrication.py -v
          
      - name: Run Safety Tests (EV-017 through EV-023)
        run: |
          cd backend
          pytest tests/test_safety.py -v
          
      - name: Run Reliability Tests (EV-024, EV-025)
        run: |
          cd backend
          pytest tests/test_reliability.py -v
          
      - name: Run Operations Tests (EV-026)
        run: |
          cd backend
          pytest tests/test_operations.py -v
          
      - name: Run Auditability Tests (EV-027, EV-028)
        run: |
          cd backend
          pytest tests/test_auditability.py -v

      - name: Run Frontend Tests
        run: |
          cd frontend
          npm ci
          npm test
          npm run test:e2e
```

## Test Execution Commands

### Run All Eval Tests
```bash
cd backend
pytest tests/ -v --tb=short -x
```

### Run Specific Test
```bash
cd backend
pytest tests/test_matching.py::test_score_formula_fidelity -v
```

### Run with Coverage
```bash
cd backend
pytest tests/ --cov=app --cov-report=html
```

### Run Deterministic/Fixture Mode
```bash
cd backend
ENABLE_MOCK_PROVIDER=true pytest tests/ -v
```

### Run Only P0 Tests (Blocker/Critical)
```bash
cd backend
pytest tests/ -v -k "not p1" --tb=short
```

## Post-MVP Exceptions

| Test ID | Exception Reason | Target |
|---------|------------------|--------|
| EV-023 | Requires large annotated dataset for statistical significance | v1.1 |
| EV-026 | Requires billing integration for accurate cost tracking | v1.2 |
| EV-028 | Requires methodology version migration tooling | v1.1 |

## Regression Policy

Per Evals document Section 10:
- Every change identifies affected evaluation suites
- Minimum pre-merge: schema validity, evidence support, fabrication prevention, score formula fidelity, score repeatability, authorization, deletion, P0 workflow fixtures
- Candidate release compared against frozen baseline
- Blocker/Critical regressions stop release
- Major regressions require fix before general release