# InterviewMate Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-12 - MVP Alpha

### Added

#### Foundation (Phase B)
- **Project Structure**: Full-stack monorepo with Next.js 16 frontend and FastAPI backend
- **Environment Configuration**: Pydantic Settings with validation, `.env.example` templates
- **Authentication**: JWT-based auth with register/login, password hashing (Argon2id), token refresh
- **Database Schema**: Complete PRD entity implementation (User, Workspace, Resume, JD, Analysis, Interview, Practice, Portfolio, Readiness, Audit, AIRequest)
- **Database Migrations**: Alembic setup with initial migration
- **Object Storage Abstraction**: S3-compatible interface with local/MinIO/production implementations
- **AI Provider Abstraction**: MistralProvider with timeouts, retries, backoff, structured output validation, mock provider
- **Design Token System**: Tailwind v4 CSS-first config matching DESIGN.md (colors, typography, spacing, glassmorphism)
- **Structured Logging**: JSON logging with correlation IDs
- **Audit Events**: Comprehensive audit trail for all mutating operations
- **Feature Flags**: Environment-based flag system

#### Resume & JD Ingestion (Phase C)
- **Resume Upload**: Drag-drop PDF/DOCX with validation, progress states
- **JD Upload/Paste**: Text area + file upload with parse preview
- **Document Parsing**: PyMuPDF (PDF) + python-docx (DOCX) with evidence spans
- **Parse Preview**: Structured data display with confidence, warnings, "Not found" preferences
- **User Confirmation**: Explicit approval creates immutable versioned records

#### Resume-JD Analysis (Phase D)
- **Structured Extraction**: Versioned schemas for resume and JD
- **Requirement Categorization**: Must Have / Should Have / Nice to Have classification
- **Multi-Dimensional Matching**: Skills, experience, responsibilities, keywords, education, tools, domain, seniority, projects, achievements
- **Evidence-Linked Output**: Every match traces to source spans
- **Deterministic Scoring**: Weighted formula (25% Skills + 20% Experience + 15% Keywords + 15% Responsibilities + 10% Education + 10% Tools/Tech + 5% Role-Specific)
- **Methodology Versioning**: Scores stored with `methodology_version` for comparability
- **Score Transparency**: Component breakdown, matched evidence, unmatched requirements, confidence, uncertainty notes
- **ATS Label**: "Estimated ATS Compatibility / Resume-JD Match Score" with disclaimer

#### Gap Analysis & Resume Optimizer (Phase E)
- **Gap Format**: "Gap → Why it matters → Evidence from JD → Suggested action"
- **Suggestion Format**: "Original → AI Suggestion → Reason" with evidence map and confidence
- **Individual Actions**: Accept, reject, edit, regenerate per suggestion
- **Rejection Memory**: Rejected unsupported claims tracked, not re-introduced
- **Immutable Versions**: Each accept creates new ResumeVersion
- **Export**: Approved content only (DOCX + JSON machine-readable)
- **Fabrication Prevention**: Never invents experience, employers, metrics, credentials

#### Mock Interview (Phase F)
- **Question Generation**: Personalized using confirmed resume, JD, target role, round, difficulty, weakness profile
- **Categories**: Recruiter, HR, Behavioral, Technical, Product, System Design, Case Study, Problem Solving, Situational, Domain
- **Question Metadata**: Category, difficulty, relevance reason, competency, rubric, expected signals, source references
- **Server-Side State Machine**: One active question, bounded follow-ups, pause/resume/skip/restart/complete
- **Answer Evaluation**: Rubric scores, strengths/weaknesses, missing points, better-answer guidance, STAR assessment
- **Coaching Label**: Feedback explicitly labeled as guidance, not claims about candidate

#### Readiness Dashboard (Phase G)
- **Overall Score**: Weighted aggregate of component scores
- **Component Scores**: Resume, JD Match, Technical, Product, Communication, Behavioral, Portfolio
- **State Handling**: Empty, loading, partial, stale, error states
- **"Insufficient Evidence"**: Instead of misleading zeros for new users
- **History**: Practice sessions, mock interviews, resume improvements
- **Progress Over Time**: Methodology-versioned comparable scores only
- **Next Best Action**: Single recommendation with rationale and direct action path

#### Evaluation Framework (Phase H)
- **Test Mapping**: EV-001 through EV-028 mapped to test files and fixtures
- **CI Pipeline**: GitHub Actions workflow for all eval categories
- **Fixture Structure**: Organized test data for parsing, matching, optimizer, safety
- **Regression Policy**: Blocker/Critical/Major/Minor severity with actions

#### Documentation
- `README.md` - Setup, architecture, environment, testing, deployment
- `BUILD_PLAN.md` - Phased implementation plan with milestones
- `DESIGN_MAPPING.md` - Design ZIP screen-to-route/component mapping
- `IMPLEMENTATION_NOTES.md` - Assumptions, conflicts, deviations, unresolved questions
- `ARCHITECTURE.md` - System components, data flow, storage boundaries, AI workflow
- `SECURITY.md` - Threat model, controls, AI-specific security, compliance
- `EVAL_IMPLEMENTATION.md` - Evals test ID mapping and CI commands

### Security
- Cross-user isolation enforced at database and API layer
- Signed URLs for object storage access
- API keys never in client bundles, logs, or error messages
- Input validation on all endpoints (Pydantic)
- File upload validation (type, size, malware scan integration point)
- Prompt injection detection in document parsing
- Output schema validation before persistence
- Audit logging for all mutating operations

### Design System
- Colors: Surface #f8f9ff, On-Surface #0b1c30, Primary #4648d4, Secondary #565e74
- Typography: Geist (headings), Inter (body)
- Layout: 12-col fluid grid, 1200px max, 24px gutters
- Components: Glass cards, status chips, gradient buttons, focused inputs
- States: Empty, loading, partial, success, error, low-confidence
- Accessibility: Keyboard nav, visible focus, ARIA labels, contrast ratios

### API Endpoints (v1)
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /me`
- Workspaces: `GET/POST /workspaces`, `GET /workspaces/{id}`
- Resumes: `POST /resumes/upload`, `GET /resumes`, `GET /resumes/{id}`, `GET /resumes/{id}/preview`, `POST /resumes/{id}/confirm`, `POST /resumes/{id}/export`
- JDs: `POST /jds/upload`, `GET /jds`, `GET /jds/{id}`, `POST /jds/{id}/confirm`
- Analyses: `POST /analyses`, `GET /analyses/{id}`, `GET /analyses/{id}/score`, `GET /analyses/{id}/gaps`
- Optimizer: `GET /optimizer/suggestions`, `POST /optimizer/suggestions/{id}/accept|reject|regenerate|edit`
- Mock Interview: `POST /mock-interview`, `GET /mock-interview/{id}`, `POST /mock-interview/{id}/question`, `POST /mock-interview/{id}/answer`, `POST /mock-interview/{id}/pause|resume|complete`
- Practice: `POST /practice`, `GET /practice`
- Readiness: `GET /readiness`
- Profile: `GET /profile/settings`, `POST /profile/export`, `DELETE /profile`

### Known Limitations (Alpha)
- STT/TTS: Deferred to post-MVP (text-only mock interviews)
- Background Jobs: Celery workers not yet configured (inline processing)
- Real-time Collaboration: Single-user per workspace
- Qdrant Vector Store: Using pgvector, Qdrant abstraction ready
- Malware Scanning: Integration point only, not implemented
- Audio Recording: Not in MVP scope
- Multi-language: English only
- Advanced Analytics: Basic readiness, no cohort analysis

### Fixed
- N/A (initial release)

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Security
- All security controls implemented per SECURITY.md
- No hardcoded secrets, no placeholder claims presented as facts
- Cross-user isolation tested (EV-019)
- Fabrication prevention tested (EV-013, EV-014, EV-015)
- Prompt injection tested (EV-022)

---

## Upcoming Releases

### [0.2.0] - MVP Beta (Target: 2026-10)
- Celery + Redis background job processing
- STT/TTS integration for voice mock interviews
- Qdrant vector store migration
- Enhanced malware scanning (ClamAV)
- Batch processing for multiple JDs
- Interview personality presets
- Collaborative workspace sharing
- Advanced analytics dashboard

### [1.0.0] - General Availability (Target: 2026-12)
- Production hardening
- Security audit completion
- Performance optimization
- Multi-language support
- Enterprise SSO (SAML/OIDC)
- White-label options
- API rate limiting tiers
- Comprehensive monitoring/alerting