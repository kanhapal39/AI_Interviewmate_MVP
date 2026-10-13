# InterviewMate - AI Career Preparation Platform

Production-quality MVP for AI-powered career preparation with resume-JD analysis, compatibility scoring, gap identification, resume optimization, and text-based mock interviews.

## Architecture

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Python FastAPI with SQLAlchemy 2.0, PostgreSQL + pgvector
- **AI Provider**: Mistral AI (with mock provider for development)
- **Object Storage**: S3-compatible abstraction (local MinIO / AWS S3)
- **Background Jobs**: Celery + Redis (planned)
- **Database Migrations**: Alembic

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 14+ with pgvector extension
- Redis (for background jobs)

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start development server
uvicorn backend:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)

```bash
# Mistral AI
MISTRAL_API_KEY=your-mistral-api-key

# Database
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/interviewmate

# Object Storage (S3-compatible)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=interviewmate-documents
AWS_ENDPOINT_URL=https://s3.amazonaws.com  # or http://localhost:9000 for MinIO

# Security
SECRET_KEY=your-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Feature Flags
ENABLE_MOCK_PROVIDER=true
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Project Structure

```
interviewmate/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # FastAPI routes
│   │   ├── core/            # Configuration, security
│   │   ├── db/              # Database models, sessions
│   │   ├── prompts/         # Versioned prompt templates
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic, AI provider
│   ├── tests/               # Backend tests
│   ├── alembic/             # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── api/         # API routes (proxy to backend)
│   │   │   ├── auth/        # Sign in/up pages
│   │   │   ├── onboarding/  # Onboarding flow
│   │   │   ├── resume/      # Resume upload
│   │   │   ├── jd/          # JD upload
│   │   │   ├── analysis/    # Analysis dashboard
│   │   │   ├── optimizer/   # Resume optimizer
│   │   │   ├── mock-interview/ # Mock interview
│   │   │   ├── readiness/   # Readiness dashboard
│   │   │   └── profile/     # Profile & settings
│   │   └── components/      # Reusable components
│   └── package.json
├── DESIGN_MAPPING.md        # Design system to route mapping
├── BUILD_PLAN.md            # Implementation plan
├── IMPLEMENTATION_NOTES.md  # Assumptions & decisions
├── ARCHITECTURE.md          # System architecture
├── SECURITY.md              # Security considerations
├── EVAL_IMPLEMENTATION.md   # Evals test mapping
└── CHANGELOG.md             # Version history
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/me` - Get current user

### Workspaces
- `GET /api/v1/workspaces` - List workspaces
- `POST /api/v1/workspaces` - Create workspace
- `GET /api/v1/workspaces/{id}` - Get workspace

### Resumes
- `POST /api/v1/resumes/upload` - Upload resume (PDF/DOCX)
- `GET /api/v1/resumes` - List resumes
- `GET /api/v1/resumes/{id}` - Get resume
- `GET /api/v1/resumes/{id}/preview` - Get parse preview
- `POST /api/v1/resumes/{id}/confirm` - Confirm parsed data
- `POST /api/v1/resumes/{id}/export` - Export resume

### Job Descriptions
- `POST /api/v1/jds/upload` - Upload/paste JD
- `GET /api/v1/jds` - List JDs
- `GET /api/v1/jds/{id}` - Get JD
- `POST /api/v1/jds/{id}/confirm` - Confirm parsed data

### Analysis
- `POST /api/v1/analyses` - Create analysis
- `GET /api/v1/analyses/{id}` - Get analysis
- `GET /api/v1/analyses/{id}/score` - Get score breakdown
- `GET /api/v1/analyses/{id}/gaps` - Get gap analysis

### Optimizer
- `GET /api/v1/optimizer/suggestions` - Get suggestions
- `POST /api/v1/optimizer/suggestions/{id}/accept` - Accept suggestion
- `POST /api/v1/optimizer/suggestions/{id}/reject` - Reject suggestion
- `POST /api/v1/optimizer/suggestions/{id}/regenerate` - Regenerate
- `POST /api/v1/optimizer/suggestions/{id}/edit` - Edit suggestion

### Mock Interview
- `POST /api/v1/mock-interview` - Start session
- `GET /api/v1/mock-interview/{id}` - Get session
- `POST /api/v1/mock-interview/{id}/question` - Get next question
- `POST /api/v1/mock-interview/{id}/answer` - Submit answer
- `POST /api/v1/mock-interview/{id}/pause` - Pause
- `POST /api/v1/mock-interview/{id}/resume` - Resume
- `POST /api/v1/mock-interview/{id}/complete` - Complete

### Practice
- `POST /api/v1/practice` - Start practice
- `GET /api/v1/practice` - List practice sessions

### Readiness
- `GET /api/v1/readiness` - Get readiness dashboard

### Profile
- `GET /api/v1/profile/settings` - Get settings
- `POST /api/v1/profile/export` - Export data
- `DELETE /api/v1/profile` - Delete account

## Key Features

### Resume-JD Analysis
- Structured extraction with evidence spans
- Requirement categorization (Must Have / Should Have / Nice to Have)
- Evidence-linked matching across skills, experience, responsibilities, etc.
- **Deterministic weighted scoring** (25% Skills + 20% Experience + 15% Keywords + 15% Responsibilities + 10% Education + 10% Tools/Technology + 5% Role-Specific)
- Methodology versioning for comparable scores

### Resume Optimizer
- Gap analysis: "Gap → Why it matters → Evidence from JD → Suggested action"
- Suggestions: "Original → AI Suggestion → Reason" with evidence and confidence
- Individual accept/reject/edit/regenerate actions
- Rejection memory prevents re-introduction of rejected claims
- Immutable resume versions
- Export approved content only (DOCX + JSON)

### Mock Interview
- Server-side state machine (one question at a time)
- Categories: behavioral, technical, system design, product, case study, etc.
- Pause/resume/skip/restart controls
- Rubric-based evaluation with STAR assessment for behavioral questions
- Coaching guidance (not claims about what candidate said)

### Readiness Dashboard
- Overall score with component breakdown
- Practice and mock interview history
- Resume improvement history
- Progress over time (methodology-versioned)
- Next-best-action recommendation with rationale

## Safety & Trust

- Never fabricates candidate experience, skills, metrics, employers, education, certifications, projects, or achievements
- Never converts AI inference into candidate fact without explicit user confirmation
- Never presents compatibility estimate as actual ATS vendor score
- Never uses protected characteristics for readiness, matching, or evaluation
- All AI outputs validated against schemas before use
- Cross-user isolation enforced at database and API level

## Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test

# E2E tests
cd frontend
npm run test:e2e
```

## Evaluation Tests (EV-001 through EV-028)

See `EVAL_IMPLEMENTATION.md` for mapping of evaluation tests to code and CI commands.

## Deployment

### Docker (Recommended)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d
```

### Manual Deployment

1. Set up PostgreSQL with pgvector
2. Run backend migrations: `alembic upgrade head`
3. Build frontend: `npm run build`
4. Start backend with gunicorn/uvicorn
5. Start frontend with Next.js production server
6. Configure reverse proxy (nginx) and SSL

## License

Proprietary - InterviewMate Inc.