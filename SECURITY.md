# InterviewMate Security Documentation

## Threat Model

### Assets to Protect
1. **User PII**: Email, name, resume content, JD content
2. **Interview Data**: Answers, evaluations, recordings (future)
3. **AI Interactions**: Prompts, responses, metadata
4. **Authentication**: Password hashes, JWT tokens
5. **Intellectual Property**: Proprietary prompts, scoring methodology

### Threat Actors
- External attackers (credential stuffing, injection, data exfiltration)
- Malicious users (privilege escalation, data access)
- Insider threats (log access, database access)
- AI-specific: Prompt injection, model extraction, data poisoning

### Attack Surface
- Public API endpoints (auth, upload, analysis)
- File upload (PDF/DOCX parsing)
- AI provider integration (Mistral API)
- Object storage (S3/MinIO)
- Database (PostgreSQL)
- Background job queue (Redis/Celery)

## Security Controls

### Authentication & Authorization

**Authentication:**
- Argon2id password hashing (via `passlib`)
- JWT access tokens (15 min expiry) + refresh tokens (7 days)
- Secure cookie storage (HttpOnly, Secure, SameSite=Strict)
- Rate limiting on auth endpoints (5 req/min)

**Authorization:**
- Every API endpoint validates ownership
- Row-level security: `WHERE user_id = current_user_id AND workspace_id = current_workspace_id`
- Workspace-scoped resources (resumes, JDs, analyses, interviews)
- No identifier guessing: UUIDv4 for all resource IDs

**Session Management:**
- Short-lived access tokens with rotation
- Refresh token rotation on use
- Token revocation on logout/password change
- Concurrent session limits (configurable)

### Data Protection

**At Rest:**
- PostgreSQL: Transparent Data Encryption (TDE) or volume encryption
- S3: SSE-S3 or SSE-KMS encryption
- Redis: In-transit encryption (TLS), at-rest via volume encryption
- Database backups: Encrypted with KMS

**In Transit:**
- TLS 1.3 for all external connections
- mTLS for service-to-service (backend ↔ Redis, backend ↔ DB)
- Certificate pinning for Mistral API

**Data Minimization:**
- Only store necessary PII
- Resume/JD text stored but can be purged per retention policy
- AI request/response metadata sanitized before storage
- No raw audio stored in MVP (text-only)

### Input Validation & Sanitization

**File Upload:**
- MIME type validation (PDF, DOCX only)
- File size limits (10MB default)
- Filename sanitization (UUID + extension)
- Malware scanning integration point (ClamAV/VirusTotal)
- Parsing in isolated worker process

**API Input:**
- Pydantic models for all request bodies
- Strict type validation
- SQL injection prevention via SQLAlchemy ORM
- XSS prevention: No raw HTML rendering, auto-escaping in React

**AI Input:**
- User content treated as untrusted data
- Prompt templates use bounded context, not full documents
- Prompt injection detection in document parsing
- Output schema validation before persistence

### AI-Specific Security

**Prompt Injection Prevention:**
- Document parsing extracts text only, no executable instructions
- User content never directly interpolated into system prompts
- Structured output with schema validation
- "Ignore previous instructions" detection in parsing

**Model Output Safety:**
- All model outputs validated against Pydantic schemas
- Failed validation → safe fallback, never persisted
- Fabrication detection: Cross-reference with source evidence
- Confidence thresholds for auto-acceptance

**Data Leakage Prevention:**
- No PII in prompts sent to Mistral (only relevant extracts)
- API keys never in client bundles, logs, or error messages
- Request/response metadata sanitized (no raw content in AIRequest table)

### Infrastructure Security

**Network:**
- Private subnets for database, Redis, workers
- Public subnet only for load balancer/frontend
- Security groups: least privilege
- VPC endpoints for AWS services

**Secrets Management:**
- `.env` files never committed (in `.gitignore`)
- Production: AWS Secrets Manager / HashiCorp Vault
- Rotation policy for Mistral API key, DB password, JWT secret
- CI/CD injects secrets at deploy time

**Logging & Monitoring:**
- Structured JSON logging (no PII in logs)
- Audit events for all mutating operations
- Alert on: failed auth spikes, unusual API patterns, AI errors
- Log retention: 90 days default, audit events 1 year

### Privacy & Compliance

**GDPR/CCPA:**
- Data export endpoint (JSON + DOCX)
- Data deletion endpoint (soft delete + purge job)
- Consent tracking for audio/transcript (future)
- Privacy policy linked in signup/footer

**Retention Policies:**
- Configurable per user (7-365 days)
- Background job enforces retention
- Audit events retained 1 year minimum
- Immutable records (resume versions) preserved but de-identified on delete

**Data Processing Agreement:**
- Mistral AI DPA in place
- No training on customer data (per Mistral terms)
- Subprocessor list maintained

### Incident Response

**Detection:**
- Automated alerts for security events
- WAF rules for common attacks
- Anomaly detection on API usage

**Response:**
- Runbook for: credential compromise, data breach, AI misuse
- 1-hour SLA for critical incidents
- Customer notification within 72 hours (GDPR)

**Recovery:**
- Automated backups (daily, point-in-time recovery)
- DR plan with RTO < 4 hours, RPO < 1 hour
- Regular restore testing

## Secure Development Practices

### Code Review Requirements
- All PRs require 2 approvals
- Security checklist for auth, input validation, AI outputs
- Dependency scanning (Dependabot/Snyk)
- SAST in CI (Bandit for Python, ESLint security for TS)

### Dependency Management
- Pin exact versions in `requirements.txt` / `package-lock.json`
- Monthly dependency updates
- License compliance check
- No unpinned or git dependencies

### Testing
- Unit tests for auth, validation, scoring logic
- Integration tests for API endpoints
- AI eval tests (EV-001 through EV-028)
- Penetration testing annually

## Configuration Checklist

### Production Deployment
- [ ] `ENABLE_MOCK_PROVIDER=false`
- [ ] `SECRET_KEY` rotated, 32+ chars
- [ ] `MISTRAL_API_KEY` in secrets manager
- [ ] `DATABASE_URL` with SSL mode
- [ ] `ALLOWED_ORIGINS` restricted to production domains
- [ ] TLS certificates configured
- [ ] WAF rules enabled
- [ ] Backup encryption verified
- [ ] Audit logging to secure destination
- [ ] Retention job scheduled
- [ ] Health checks configured
- [ ] Rate limits tuned

### Development
- [ ] `ENABLE_MOCK_PROVIDER=true`
- [ ] Local `.env` not committed
- [ ] Pre-commit hooks for secrets scanning
- [ ] Test database separate from production
- [ ] Mock Mistral responses for CI

## Contact

Security issues: security@interviewmate.ai
PGP key: [link to keyserver]