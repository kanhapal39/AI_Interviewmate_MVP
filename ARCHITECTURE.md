# InterviewMate Architecture

## System Overview

InterviewMate is an AI-powered career preparation platform implementing the complete MVP loop:
Sign up → Upload resume → Upload/paste JD → Parse and verify → Resume-JD analysis → Estimated compatibility score → Gap analysis → Review factual resume suggestions → Accept/reject/edit → Export resume → Generate JD-specific questions → Text mock interview → Evaluate answers → Identify weak areas → Readiness dashboard

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Client (Browser)                             │
│  Next.js 16 + React 19 + Tailwind CSS v4                               │
│  ─────────────────────────────────────────────────────────────────────  │
│  Pages: Landing, Auth, Onboarding, Resume Upload, JD Upload,           │
│  Analysis Dashboard, Optimizer, Mock Interview, Readiness, Settings    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ HTTPS / REST API
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API Gateway / Load Balancer                    │
│  (nginx / cloud load balancer)                                          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
            ┌────────────┐ ┌──────────┐ ┌──────────────┐
            │  Frontend  │ │  Backend │ │  Object Store │
            │   API      │ │  (FastAPI)│ │  (S3/MinIO)   │
            │  Routes    │ │           │ │               │
            └────────────┘ └────┬─────┘ └──────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
            ┌───────────┐ ┌────────────┐ ┌──────────┐
            │PostgreSQL │ │   Redis    │ │ pgvector │
            │  + pgvec  │ │  (Celery)  │ │ Embeddings│
            └───────────┘ └────────────┘ └──────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  Mistral AI API  │
                        │  (Server-side)   │
                        └──────────────────┘
```

## Component Details

### Frontend (Next.js App Router)

**Pages & Routes:**
- `/` - Landing page
- `/auth/signin`, `/auth/signup` - Authentication
- `/onboarding` - 3-step onboarding flow
- `/resume/upload` - Resume upload with drag-drop
- `/jd/upload` - JD paste/upload
- `/analysis/[id]` - Analysis dashboard with tabs
- `/optimizer` - Resume optimizer with suggestions
- `/mock-interview/[id]` - Text mock interview
- `/readiness` - Readiness dashboard
- `/profile/settings` - Profile & privacy

**State Management:**
- React hooks for local state
- Server components where possible
- Client components for interactivity
- API routes as BFF (Backend for Frontend) proxying to FastAPI

**Design System:**
- CSS-first Tailwind v4 configuration
- Design tokens from DESIGN.md (colors, typography, spacing)
- Glassmorphic cards, accent gradients, status chips
- Responsive: 12-col desktop, 8-col tablet, 4-col mobile

### Backend (FastAPI)

**Core Modules:**
- `app/core/config.py` - Pydantic Settings with env validation
- `app/core/security.py` - JWT auth, password hashing
- `app/db/session.py` - SQLAlchemy async session management
- `app/db/models.py` - All PRD entities with relationships

**API Layer:**
- `app/api/v1/router.py` - Versioned REST endpoints
- `app/schemas.py` - Pydantic request/response models
- Dependency injection for DB sessions, auth

**Services:**
- `app/services/mistral_provider.py` - AI provider abstraction
  - Timeouts, retries, exponential backoff
  - Structured JSON output with schema validation
  - Model selection by task
  - Token/context budgeting
  - Mock provider for dev/test
- `app/services/document_parser.py` - PDF/DOCX parsing (PyMuPDF, python-docx)
- `app/services/analysis_engine.py` - Resume-JD matching logic
- `app/services/scoring.py` - Deterministic weighted scoring
- `app/services/optimizer.py` - Gap analysis & suggestion generation
- `app/services/interview_engine.py` - Server-side state machine

**AI Provider Abstraction:**
```
MistralProvider (interface)
├── MistralProvider (production)
│   ├── HTTP client with retries/backoff
│   ├── Structured output validation
│   ├── Metadata tracking (latency, tokens, cost)
│   └── Error mapping to safe states
└── MockProvider (development/test)
    ├── Fixture-based responses
    ├── Deterministic for eval tests
    └── No network calls
```

### Database Schema (PostgreSQL + pgvector)

**Core Entities:**
- `User` - Authentication, preferences
- `Workspace` - User's workspace container
- `Resume` + `ResumeVersion` - Immutable versions
- `JobDescription` - Parsed JD with confirmed data
- `ResumeJDAnalysis` - Match results, scores, gaps
- `Skill` + `SkillGap` - Normalized skills & gaps
- `InterviewSession` - Mock interview state machine
- `InterviewQuestion` + `InterviewAnswer` - Q&A pairs
- `InterviewEvaluation` - Rubric-based feedback
- `PracticeSession` - Practice arena
- `Portfolio` + `PortfolioProject` - Deferred
- `ReadinessScore` - Versioned readiness metrics
- `UserProgress` - Milestone tracking
- `AuditEvent` - Security/compliance logging
- `AIRequest` - AI call metadata

**Ownership Enforcement:**
- All user-owned records have `user_id` and `workspace_id`
- Row-level security policies or application-level checks
- Signed URLs for object storage access

### AI Workflow

**Prompt Architecture:**
- Versioned templates in `app/prompts/v1/`
- Each prompt defines: input variables, authorized context, task instructions, expected JSON schema, evidence requirements, confidence requirements, prohibited behavior, refusal behavior
- Runtime validation against Pydantic schemas
- Bounded context retrieval (no full document dumping)

**Task-Specific Models:**
- Extraction: `mistral-large-latest` (temp 0.0)
- Matching: `mistral-large-latest` (temp 0.0)
- Rewriting: `mistral-large-latest` (temp 0.1)
- Question Generation: `mistral-large-latest` (temp 0.7)
- Answer Evaluation: `mistral-large-latest` (temp 0.0)

**Scoring Methodology (Deterministic):**
```
Overall Match Score = 
  25% Skills Match +
  20% Experience Match +
  15% Keyword Match +
  10% Education Match +
  15% Responsibilities Match +
  10% Tools/Technology Match +
  5% Role-Specific Requirements
```
- Weights configurable by role family
- Stored with `methodology_version` on each score
- Never calculated by the model

### Document Processing Pipeline

```
Upload → Validate (type, size) → Store in S3 → Queue Parse Job
                                                        ↓
                                              PyMuPDF / python-docx
                                                        ↓
                                              Extract text + structure
                                                        ↓
                                              LLM Extraction (versioned schema)
                                                        ↓
                                              Validate schema + confidence
                                                        ↓
                                              Store structured data + evidence spans
                                                        ↓
                                              User preview + correction
                                                        ↓
                                              User confirms → Immutable version
```

### Interview State Machine

```
IDLE → ACTIVE → (ANSWER_SUBMITTED → EVALUATING → ACTIVE)*
                         ↓
                    PAUSED ←→ ACTIVE
                         ↓
                    COMPLETED → GENERATING_FEEDBACK → FEEDBACK_READY
                         ↓
                    ERROR (on failure)
```
- Server-side only; model cannot advance state
- One active question at a time
- Bounded follow-ups per question
- Partial session recovery

### Object Storage Abstraction

```python
class StorageProvider:
    async def upload(file: bytes, key: str) -> str
    async def download(key: str) -> bytes
    async def delete(key: str) -> bool
    async def presigned_url(key: str, expiry: int) -> str

# Implementations:
# - S3StorageProvider (production)
# - LocalStorageProvider (development)
# - MockStorageProvider (tests)
```

### Background Jobs (Celery)

- Document parsing
- Resume-JD analysis
- AI suggestion generation
- Interview evaluation
- Readiness score calculation
- Data export generation

## Data Flow Examples

### Resume Upload & Analysis
1. User uploads PDF → Frontend → Backend API
2. Backend stores in S3, creates `Resume` record with `parse_status=pending`
3. Celery worker picks up, extracts text with PyMuPDF
4. LLM extracts structured data with evidence spans
5. Backend stores structured data, sets `parse_status=parsed`
6. User reviews preview, corrects if needed, confirms
7. Backend creates `ResumeVersion` (immutable)
8. User uploads/pastes JD → similar flow
9. User triggers analysis → `ResumeJDAnalysis` created
10. Celery runs matching engine → deterministic score + gaps
11. Results stored, user views dashboard

### Mock Interview
1. User starts interview → `InterviewSession` created with `status=idle`
2. User clicks "Start" → `status=active`, first question generated
3. Server returns one question (category, difficulty, rubric, expected signals)
4. User submits answer → `InterviewAnswer` stored
5. Server evaluates (or queues) → `InterviewEvaluation` created
6. Server determines next action (follow-up, next question, complete)
7. Repeat until complete → final evaluation generated
8. Results feed into readiness dashboard

## Security Boundaries

- **API Keys**: Never in frontend, never in logs, only in backend env
- **Authentication**: JWT with short expiry, refresh tokens
- **Authorization**: Every query filtered by `user_id`/`workspace_id`
- **Object Storage**: Signed URLs with expiry, no public access
- **AI Calls**: Server-side only, sanitized inputs, validated outputs
- **Audit Logging**: All mutating operations logged with user, action, entity
- **Data Retention**: Configurable per user settings, enforced by background job

## Scalability Considerations

- Stateless backend (horizontal scaling)
- pgvector for embeddings (can migrate to Qdrant)
- Celery workers for async processing
- CDN for static assets
- Database connection pooling
- Read replicas for analytics queries