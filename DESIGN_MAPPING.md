# InterviewMate Design Mapping

## Design System Source
- **ZIP**: `stitch_interviewmate_ai_career_copilot.zip`
- **Extracted**: `design_inspection/`
- **Design System Spec**: `design_inspection/stitch_interviewmate_ai_career_copilot/interviewmate/DESIGN.md`
- **Color Palette**: surface #f8f9ff, on-surface #0b1c30, primary #4648d4, secondary #565e74, error #ba1a1a
- **Typography**: Geist (headings), Inter (body)
- **Layout**: 12-column fluid grid, 1200px max-width, 24px gutters
- **Components**: Glass cards, status chips, accent-gradient buttons, input fields with focus glow

## Screen-to-Route/Component Mapping

### 1. Landing Page
- **Design**: `landing_page/screen.png`, `landing_page/code.html`
- **Route**: `/` (root)
- **Component**: `LandingPage`
- **State**: empty (hero), loading (animating), success (CTA visible)
- **Assets**: hero illustration, primary CTA button, feature highlights

### 2. Sign Up / Login
- **Design**: onboarding_flow screens, profile_settings code
- **Route**: `/auth/signin`, `/auth/signup`
- **Component**: `AuthScreen`, `AuthForm`
- **State**: empty, loading, success (onboarding complete), error
- **Assets**: brand typography, input fields, primary button, divider text

### 3. Onboarding
- **Design**: onboarding_flow/code.html, onboarding_flow/screen.png
- **Route**: `/onboarding`
- **Component**: `OnboardingWizard`
- **Steps**: upload resume, paste JD, set target role, interview preferences
- **State**: empty/step1, loading/step_transition, success/complete
- **Progress indicators** match design status chips

### 4. Resume Upload
- **Design**: resume_optimizer/screen.png, resume_optimizer/code.html
- **Route**: `/resume/upload`
- **Component**: `ResumeUploader`, `ParseProgress`
- **State**: empty (drop zone), loading (progress bar), success (preview), error (retry)
- **Supported formats**: PDF, DOCX
- **Progress**: visible parse progress, retries, failure states
- **Parse warnings**: "Not found," "Needs review," "Insufficient evidence"

### 5. JD Upload / Paste
- **Design**: main_dashboard/screen.png, main_dashboard/code.html
- **Route**: `/jd/upload`
- **Component**: `JDUploader`, `JDPasteEditor`
- **State**: empty (upload zone), loading (parse status), success (preview), error
- **Paste flow**: plain text editor with JD parsing toggle
- **Parse preview**: requirements broken into Must Have/Should Have/Nice to Have

### 6. Analysis Dashboard
- **Design**: main_dashboard/screen.png, main_dashboard/code.html, progress_readiness/screen.png, progress_readiness/code.html
- **Route**: `/analysis/:analysisId`
- **Component**: `AnalysisDashboard`, `ScoreCard`, `GapList`, `SuggestionList`
- **State**: empty (no analysis), loading (spinning), partial (partial results), success (full results), error
- **Overall score**: "Estimated ATS Compatibility / Resume-JD Match Score"
- **Score breakdown**: component percentages with evidence links
- **Gap analysis**: collapsible gap items with "Why it matters → Evidence → Suggested action"

### 7. Estimated Score Detail
- **Design**: resume_jd_analysis/screen.png, resume_jd_analysis/code.html
- **Route**: `/analysis/:analysisId/score`
- **Component**: `ScoreDetail`, `MethodologyVersion`, `EvidenceLinks`
- **Shows**: score methodology version, confidence level, component breakdown
- **Matched evidence**: click-to-reveal source spans from resume/JD
- **Unmatched requirements**: listed with "Insufficient evidence" label
- **Never presents score as actual ATS vendor score**

### 8. Gap Analysis
- **Design**: resume_optimizer/screen.png (gap section), resume_optimizer/code.html
- **Route**: `/analysis/:analysisId/gaps`
- **Component**: `GapAnalysis`, `GapItem`, `SuggestionCard`
- **Format per gap**: "Gap → Why it matters → Evidence from JD → Suggested action"
- **Accept/Reject/Edit/Regenerate** per suggestion
- **Rejection memory**: rejected claims not silently reintroduced
- **Export**: only approved content included

### 9. Resume Optimizer
- **Design**: resume_optimizer/screen.png, resume_optimizer/code.html
- **Route**: `/optimizer`
- **Component**: `ResumeOptimizer`, `SuggestionManager`, `ExportDOCX`
- **Shows**: "Original → AI Suggestion → Reason" for each suggestion
- **Individual actions**: accept (approves and versions), reject (records in rejection memory), edit (regenerate), regenerate
- **Immutable versions**: each edit creates new version, original preserved
- **DOCX export**: of approved content only
- **Machine-readable export**: JSON with structured data

### 10. Interview Preparation
- **Design**: interview_prep_hub/screen.png, interview_prep_hub/code.html, question_practice/screen.png, question_practice/code.html
- **Route**: `/prepare`
- **Component**: `InterviewPrepHub`, `QuestionSet`, `CategoryFilter`
- **Generated question sets** using confirmed resume and JD
- **Categories**: recruiter, HR, behavioral, technical, product, system design, case study, problem solving, situational, domain
- **Question metadata**: category, difficulty, relevance reason, competency, rubric, expected answer signals, source references

### 11. Practice Arena
- **Design**: question_practice/screen.png, question_practice/code.html
- **Route**: `/practice/:sessionId`
- **Component**: `PracticeSession`, `QuestionRenderer`, `ProgressTracker`
- **One question at a time** with progress tracking
- **Categories filterable**
- **State**: empty (no sessions), loading, active question, completion

### 12. Text Mock Interview
- **Design**: ai_mock_interview/screen.png, ai_mock_interview/code.html, mock_interview_results/screen.png, mock_interview_results/code.html
- **Route**: `/mock-interview/:sessionId`
- **Component**: `MockInterview`, `ActiveQuestion`, `AnswerSubmission`, `FinalAssessment`
- **Server-side state machine**: one active question at a time
- **Flow**: question → answer submission → follow-up (bounded) → pause/resume → skip → restart → completion
- **Final assessment**: score, strengths, weaknesses, missing points, better-answer guidance, confidence, practice recommendations
- **STAR assessment** for behavioral questions
- **Answer feedback**: rubric scores, evidence, confidence, next actions — labeled as coaching guidance

### 13. Interview Feedback
- **Design**: mock_interview_results/screen.png, mock_interview_results/code.html
- **Route**: `/mock-interview/:sessionId/feedback`
- **Component**: `InterviewFeedback`, `RubricScoring`, `EvidenceSummary`
- **Rubric scores** per competency
- **Evidence** from answers with source references
- **Confidence level** per evaluation
- **Next actions** / practice recommendations

### 14. Challenge Mode Placeholder
- **Design**: challenge_mode/screen.png, challenge_mode/code.html
- **Route**: `/challenge/:challengeId` (deferred)
- **Component**: `ChallengeMode` (placeholder)
- **Status**: deferred to post-MVP unless designed for MVP launch

### 15. Portfolio Builder Placeholder
- **Design**: portfolio_builder/screen.png, portfolio_builder/code.html
- **Route**: `/portfolio` (deferred)
- **Component**: `PortfolioBuilder` (placeholder)
- **Status**: deferred to post-MVP unless designed for MVP launch

### 16. Readiness Dashboard
- **Design**: progress_readiness/screen.png, progress_readiness/code.html
- **Route**: `/readiness`
- **Component**: `ReadinessDashboard`, `ProgressHistory`, `NextBestAction`
- **Overall Interview Readiness Score**
- **Component scores**: Resume, JD Match, Technical, Product, Communication, Behavioral, Portfolio (where evidence exists)
- **States**: empty (new user), loading, partial (some data), stale (data outdated), error
- **Practice and mock interview history** with dates and scores
- **Resume improvement history** with before/after comparisons
- **Progress over time**: methodology-versioned, comparable scores (not mixed across model versions)
- **One next-best-action recommendation** with rationale and direct action path
- **"Insufficient evidence"** instead of misleading zero scores for new users

### 17. Profile/Settings and Privacy Control
- **Design**: profile_settings/screen.png, profile_settings/code.html
- **Route**: `/profile/settings`
- **Component**: `ProfileSettings`, `PrivacyControl`, `DataExport`, `DataDeletion`
- **Settings**: personal info, audio/transcript retention, export/delete data, preferences
- **Consent management**: STT/TTS retention preferences
- **Data export**: machine-readable format of user data
- **Data deletion**: with audit trail, preserves immutable records, removes user content

## Responsive Behavior
- **Desktop**: 12-column grid, 1200px max-width, 24px gutters
- **Tablet**: 8-column grid, 32px margins, adjusted spacing
- **Mobile**: 4-column grid, 16px margins, stacked layout
- **Base unit**: 8px vertical rhythm, stack-sm (8px), stack-md (16px), stack-lg (32px), stack-xl (64px)
- **All screens** support responsive collapse/navigation adjustments

## Component State Mapping (from design system)
Each UI component must support these visual states, mapped from the design system:
- **Empty state**: no data, friendly illustration or placeholder
- **Loading state**: skeleton spinner, progress indicator
- **Success state**: checked visuals, confirmed actions
- **Error state**: inline error messaging, retry action
- **Low-confidence state**: "Insufficient evidence" chip, muted styling
- **Glassmorphic depth**: backdrop-blur, subtle borders, tonal elevation
- **Status chips**: semi-transparent with high-contrast text
- **Accent gradient**: primary color gradient on primary actions
- **Inner highlight**: white at 10% opacity on button hover/active