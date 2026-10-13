# InterviewMate Implementation Notes

## Assumptions and Design Choices

### 1. Routing Map Consistency (Design ZIP vs PRD)
**Conflict**: The design ZIP maps specific screens to routes (e.g., `/mock-interview/:sessionId`, `/readiness`, `/optimizer`), while the PRD defines the MVP loop as a user journey without prescribing exact URL paths.

**Resolution**: Adopt the design ZIP route map as the primary source for UI routes, since it provides precise screen-to-path mappings. The PRD journey is preserved functionally but routed per the design system. Conflicting routes are documented and the design system interpretation is chosen for consistency.

Mapped routes (design ZIP → PRD journey):
- `/` → Landing page (PRD start)
- `/auth/signin` / `/auth/signup` → Sign up/login (PRD user onboarding)
- `/onboarding` → Onboarding (PRD plain text: "Upload resume → Upload/paste JD")
- `/resume/upload` → Resume upload (PRD: "Resume upload for PDF and DOCX")
- `/jd/upload` → JD upload/paste (PRD: "JD upload and paste flow")
- `/analysis/:analysisId` → Analysis dashboard (PRD: "Resume–JD analysis → Estimated compatibility score")
- `/optimizer` → Resume optimizer (PRD: "Gap analysis and resume optimizer")
- `/mock-interview/:sessionId` → Text mock interview (PRD: "Text mock interview → Evaluate answers")
- `/readiness` → Readiness dashboard (PRD: "Readiness dashboard")
- `/profile/settings` → Profile/settings (PRD: "Profile and privacy")

### 2. Scoring Methodology (Deterministic vs AI-Decided)
**Conflict**: The PRD specifies a deterministic weighted formula (25% Skills + 20% Experience + 15% Keyword + 15% Responsibilities + 10% Education + 10% Tools/Technology + 5% Role-Specific), while also saying the model should generate scores.

**Resolution**: The final compatibility score is **always calculated deterministically** using the weighted formula stored as a `Methodology` object. The model may produce intermediate rankings or category strengths, but the final numerical score is never an AI inference. This is enforced both in backend logic and in the prompt template: the model returns category scores and evidence, and the server code computes the weighted total. The score display is always labeled "Estimated ATS Compatibility / Resume-JD Match Score" with methodology version.

### 3. "Estimated ATS Compatibility" Label
**Conflict**: The PRD calls for "Estimated ATS Compatibility / Resume-JD Match Score" but the Evals document warns against presenting any score as an actual ATS vendor score.

**Resolution**: The label "Estimated ATS Compatibility" is used **only as a descriptive category label** above the numerical score, never as a claim of vendor validation. The score is always accompanied by:
- "Methodology v{X}" 
- Confidence level
- Breakdown of component contributions
- Matched evidence vs unmatched requirements
- Explicit statement: "This is an estimate, not an actual ATS vendor score."

### 4. Resume Optimizer - AI Suggestion vs Fabrication
**Conflict**: The PRD requires the optimizer to never invent experience/skills/metrics, but also to generate suggestions. The Evals document requires "Not found"/"Needs review"/"Insufficient evidence" preferences.

**Resolution**: The optimizer generates suggestions only from **confirmed evidence** (source spans, versioned data). If the model has no evidence for a claim, the system outputs:
- "Not found" (no evidence in source documents)
- "Needs review" (plausible but unconfirmed)
- "Insufficient evidence" (below confidence threshold)
No suggestion is exported unless the user explicitly approves it. Rejected suggestions are tracked in rejection memory.

### 5. Mock Interview State Machine
**Conflict**: The PRD requires a server-side state machine for text mock interviews, but the design ZIP shows a more fluid UI flow.

**Resolution**: The server-side state machine is mandatory (PRD requirement). The UI implements one-question-at-a-time with server-enforced state transitions. The design ZIP's fluid behavior is adapted to match the server machine: "Next," "Pause," "Resume," "Skip," "Restart," and "Completion" are the only allowed transitions, and the model cannot bypass them.

### 6. Protected Characteristics in Evaluation
**Conflict**: The PRD and Evals both forbid using protected characteristics, but the design system includes demographic/aesthetic choices.

**Resolution**: No protected characteristics (age, gender, race, ethnicity, disability, religion, sexual orientation, veteran status) are used in any readiness score, matching algorithm, or interview evaluation. Any competency or skill assessment is role-focused only. If a question or evaluation reference could imply a protected characteristic, it is reframed to be role/skill focused.

### 7. Document Parsing - "Not Found" Preference
**Conflict**: The Evals parser tests prefer "Not found" / "Needs review" / "Insufficient evidence" over plausible inventions, but the document processing pipeline may be pressured to produce completions.

**Resolution**: The parser **always** prefers "Not found" / "Needs review" / "Insufficient evidence" when evidence is absent. A missing metric remains missing; an unconfirmed certification is not inferred. The parser reports errors from the document parser separately from LLM errors. No plausible invention is ever presented as a fact.

### 8. AI Provider Abstraction
**Conflict**: The PRD requires a Mistral provider abstraction, but the project may need to support multiple providers later.

**Resolution**: A provider abstraction layer is built from Day 1. Mistral is the default for MVP. The abstraction includes: timeout/retry/backoff, structured output validation, model selection by task, token budgeting, error mapping, and metadata tracking. A mock provider is used in development and tests. Switching to Qdrant/other vector stores follows the same abstraction pattern.

### 9. Cross-User Isolation
**Conflict**: The PRD requires "No API should return another user's document," but the design may share data in ways that could leak.

**Resolution**: Every user-owned record has `workspace_id` and `user_id` fields. Row-level security (PostgreSQL RLS) or application-level ownership checks enforce that a user can only access their own workspaces, resumes, JDs, analyses, interview sessions, and evaluations. Signed URLs for object storage include user identifiers. No identifier guessing should be possible.

### 10. Evaluation Test Coverage (EV-001 through EV-028)
**Conflict**: The Evals document defines 28+ test IDs with specific requirements, but MVP scope may not cover all.

**Resolution**: Implement EV-001 through EV-028 as the minimum. Any test that cannot be implemented without blocking MVP is marked as an explicit post-MVP exception with rationale in `EVAL_IMPLEMENTATION.md`. Critical P0 tests (fabrication, privacy breach, cross-user leakage, score formula fidelity, authorization, deletion) are never deferred.

## Unresolved Questions and Deviations

1. **Vector store choice**: pgvector vs Qdrant abstraction - pgvector for MVP, Qdrant behind interface. Timing of Qdrant integration not decided.

2. **Audio/STT-TTS subsystem**: The PRD defines audio interfaces but the MVP is text-focused. STT/TTS integration deferred to post-MVP; text-only mock interview flow implemented.

3. **Real-time collaboration**: The design system includes some collaboration indicators. MVP is single-user; multi-user features deferred.

4. **Feature flag framework**: Which feature-flag system to use (LaunchDarkly-like homemade). Decision: simple env-based flags for MVP.

5. **Malware scanning integration**: The PRD mentions malware-scan integration point. Implementation: virus-total API abstraction added as a stub; real integration requires infrastructure.

6. **Export format machine-readable**: The PRD/DOCX export + machine-readable format. Decision: JSON schema + DOCX for human; JSON machine-readable follows the structured data model.

7. **Prompt versioning strategy**: Semantic versioning (v1.0.0) vs sequential (v1, v2, v3). Decision: semantic versioning with prompt directory `prompts/v1/`, `prompts/v2/`, etc.

8. **Audit event retention**: How long to keep audit events. Decision: 1 year minimum, configurable via retention policy.

9. **Cost estimation accuracy**: The PRD requires cost estimation per AI call. Implementation: rough token-count * model-rate approximation. Exact cost requires provider billing API, which is approximated.

10. **Offline vs online evaluation**: The Evals document distinguishes offline benchmarking from production monitoring. MVP implements offline eval fixtures; production monitoring is basic and expanded post-MVP.

## Key Deviations from Source Documents

- **STT/TTS**: Deferred to post-MVP; MVP is text-only for mock interviews
- **Multi-user collaboration**: Deferred; MVP is single-user per workspace
- **Qdrant vector store**: pgvector for MVP; Qdrant integration planned for v2
- **Real-time presence indicators**: Deferred to post-MVP
- **Malware scanning**: Stub integration; real API integration post-MVP
- **Feature flag system**: Simple env-based vs third-party service
- **Audio recording/playback**: Not in MVP scope (text-focused)