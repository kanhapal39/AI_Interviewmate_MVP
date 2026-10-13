# InterviewMate MVP Build Plan

## Overview
Production-quality full-stack AI career preparation platform implementing the complete MVP loop from the PRD.

## Architecture Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, accessible components
- **Backend**: Python FastAPI
- **Database**: PostgreSQL with pgvector, migrations via Alembic
- **Vector Search**: pgvector initially, behind abstraction layer
- **Object Storage**: S3-compatible abstraction (local development + production S3)
- **Document Processing**: PyMuPDF (PDF), python-docx (DOCX)
- **Background Work**: Redis queue (Celery) for document analysis and AI tasks
- **AI Provider**: Mistral (server-side only, with mock/fallback provider)
- **Testing**: Jest/Vitest (frontend), Pytest (backend), Playwright (E2E)

## Phases & Milestones

### Phase A - Repository & Design Analysis (COMPLETED)
- Inspect repository, extract and analyze design ZIP
- Analyze PRD and Evals documents
- Create DESIGN_MAPPING.md, BUILD_PLAN.md, IMPLEMENTATION_NOTES.md

### Phase B - Foundation (Week 1-2)
- Environment validation and secrets handling (.env.example, .env.template)
- Authentication (NextAuth.js or custom JWT strategy)
- Database schema with migrations (initial tables: users, workspaces, resumes, jds, analyses, etc.)
- Object-storage abstraction (S3-compatible uploader/download)
- AI provider abstraction and mock provider
- Structured logging (structlog), error handling, audit events, feature flags
- Design-token layer from design ZIP (colors, typography, spacing, components)

### Phase C - Resume and JD Ingestion (Week 2-3)
- Resume upload (PDF/DOCX) with progress indication
- JD upload/paste flow
- File validation, size limits, malware-scan integration point
- Parsing jobs with retries and failure states
- Resume/JD parse previews with evidence spans, page references, confidence, warnings
- Immutable original documents + versioned confirmed structured data
- UI prefers "Not found," "Needs review," or "Insufficient evidence" over invented values

### Phase D - Resume-JD Analysis (Week 3-4)
- Structured resume extraction (versioned schema)
- Structured JD extraction (versioned schema)
- Requirement categorization: Must Have / Should Have / Nice to Have
- Matching across: skills, technologies, experience, responsibilities, domain, education, certifications, keywords, seniority, projects, achievements
- Evidence-linked matching output
- **Estimated score**: "Estimated ATS Compatibility / Resume-JD Match Score" (never actual ATS vendor score)
- Score methodology version, confidence, component breakdown, matched evidence, unmatched requirements, uncertainty
- **Deterministic weighted calculation** outside the model (25% Skills + 20% Experience + 15% Keyword + 15% Responsibilities + 10% Education + 10% Tools/Technology + 5% Role-Specific)
- Configurable methodology object stored with score result

### Phase E - Gap Analysis & Resume Optimizer (Week 4-5)
- Missing skills, keywords, responsibilities, experience, seniority, domain, presentation gaps
- Format: "Gap → Why it matters → Evidence from JD → Suggested action"
- Resume suggestions: "Original → AI Suggestion → Reason"
- Evidence and confidence for each suggestion
- Individual accept/reject/regenerate actions
- **Immutable resume versions** - rejection memory prevents silently reintroducing rejected claims
- Export of approved content only (DOCX + machine-readable format)
- **Safety**: Never invent experience, employers, projects, degrees, certifications, skills, metrics, or outcomes
- If user requests invented metric: refuse, request evidence, or offer clearly labeled placeholder that cannot be exported

### Phase F - Text Mock Interview (Week 5-6)
- Personalized questions using confirmed resume, confirmed JD, target role, interview round, difficulty, evidence-backed weakness profile
- Categories: recruiter, HR, behavioral, technical, product, system design, case study, problem solving, situational, domain
- Question metadata: category, difficulty, relevance reason, competency, rubric, expected answer signals, source references
- **Text mock interview**: one active question at a time
- Answer submission, bounded follow-up, pause/resume, skip, restart, completion
- **Server-side state machine** - model does not directly advance session state
- Final assessment: score, strengths, weaknesses, missing points, better-answer guidance, confidence, practice recommendations
- **STAR assessment** for behavioral questions
- System evaluates answer, not identity or protected characteristics
- Answer feedback labeled as coaching guidance, not claims about what candidate said

### Phase G - Readiness Dashboard (Week 6-7)
- Overall Interview Readiness Score
- Component scores: Resume, JD Match, Technical, Product, Communication, Behavioral, Portfolio (where evidence exists)
- States: empty, loading, partial, stale, error
- "Insufficient evidence" instead of misleading zero scores for new users
- Practice and mock interview history
- Resume improvement history
- Progress over time (methodology-versioned, comparable scores)
- One next-best-action recommendation with rationale and direct action path

### Phase H - Hardening & Evaluation (Week 7-8)
- Implement Evals document as first-class engineering artifact
- Unit tests, schema tests, parsing fixtures, matching and score fixtures
- Counterfactual score tests, hallucination and unsupported-claim tests
- Prompt-injection-in-document tests
- Authorization and cross-user isolation tests
- Integration tests (end-to-end workflow fixtures)
- Latency and retry tests
- Cost/token-budget tests
- Accessibility tests for core flows
- **Minimum**: EV-001 through EV-028 implemented or explicitly documented as post-MVP exception

## Deliverable Artifacts
1. README.md - setup, architecture, environment variables, local development, testing, deployment
2. .env.example - variable names only; no real secrets
3. ARCHITECTURE.md - system components, data flow, storage boundaries, AI workflow
4. DESIGN_MAPPING.md - design ZIP screen-to-route/component mapping
5. IMPLEMENTATION_NOTES.md - assumptions, deviations, unresolved questions, decisions
6. EVAL_IMPLEMENTATION.md - Evals test ID mapping and execution commands
7. SECURITY.md - secrets, authorization, privacy, retention, deletion, threat considerations
8. CHANGELOG.md - meaningful implementation milestones

## Key Safety Principles (enforced in both backend and prompts)
1. Never fabricate candidate experience, skills, metrics, employers, education, certifications, projects, or achievements
2. Never convert AI inference into candidate fact without explicit user confirmation
3. Never present compatibility estimate as actual vendor ATS score
4. Never claim known company-specific interview process unless source available and identified
5. Never use protected/sensitive personal characteristics for readiness, matching, or evaluation
6. Never expose system prompts, API keys, hidden evaluation data, or another user's content
7. Treat resume and JD as untrusted data, not executable instructions
8. Preserve evidence spans and source-version references for important claims
9. Display confidence and "insufficient evidence" when appropriate
10. Allow users to report incorrect feedback with audit trail

## API Workflow Requirements (versioned server actions/API endpoints)
- Authentication and current-user context
- Resume upload, parse status, preview, correction, confirmation, versions, export
- JD upload, paste, parse status, preview, correction, confirmation
- Analysis creation, status, result, score breakdown, evidence
- Gap listing, status, recommended actions
- Resume suggestion generation and accept/reject/edit operations
- Question generation and saved question sets
- Mock interview creation, answer submission, follow-up, pause/resume, completion, feedback
- Readiness dashboard and progress history
- Data export, deletion, consent, and privacy settings

## UI State Requirements
Each screen supports: empty, loading, partial, success, error, and low-confidence states
Visible labels: Candidate Fact, JD Fact, AI Suggestion, AI Inference, Confidence, Evidence, Insufficient Evidence
No color-alone communication; keyboard navigation, visible focus, accessible labels, readable contrast, responsive layouts