"""API v1 router with all InterviewMate endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import json

from app.db.session import get_db
from app.db import models as db_models
from app.schemas import (
    UserCreate, UserResponse,
    WorkspaceCreate, WorkspaceResponse,
    ResumeCreate, ResumeResponse,
    JobDescriptionCreate, JobDescriptionResponse,
    AnalysisCreate, AnalysisResponse,
    GapAnalysisResponse, SuggestionResponse,
    InterviewSessionCreate, InterviewSessionResponse,
    InterviewQuestionResponse, InterviewAnswerCreate, InterviewAnswerResponse,
    PracticeSessionCreate, PracticeSessionResponse,
    ReadinessScoreResponse,
)

router = APIRouter()


# ── Health Check ─────────────────────────────────────────────────────
@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "interviewmate-api"}


# ── Authentication & User ────────────────────────────────────────────
@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if email exists
    existing = db.query(db_models.User).filter(
        db_models.User.email == user_data.email
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user (password hashing would be here in production)
    user = db_models.User(
        email=user_data.email,
        name=user_data.name,
        password_hash=user_data.password,  # In production: hash this
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create default workspace
    workspace = db_models.Workspace(
        name=f"{user_data.name}'s Workspace",
        owner_id=user.id,
        is_default=True,
    )
    db.add(workspace)
    db.commit()

    return user


@router.post("/auth/login")
async def login(credentials: dict, db: Session = Depends(get_db)):
    """Login user (simplified - JWT tokens in production)."""
    email = credentials.get("email")
    password = credentials.get("password")

    user = db.query(db_models.User).filter(
        db_models.User.email == email
    ).first()

    if not user or user.password_hash != password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # In production: return JWT token
    return {
        "user": {"id": str(user.id), "email": user.email, "name": user.name},
        "access_token": f"mock-token-{user.id}",  # Replace with real JWT
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(user_id: UUID, db: Session = Depends(get_db)):
    """Get current user profile."""
    user = db.query(db_models.User).filter(db_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── Workspace ────────────────────────────────────────────────────────
@router.get("/workspaces", response_model=List[WorkspaceResponse])
async def list_workspaces(user_id: UUID = Query(...), db: Session = Depends(get_db)):
    """List user's workspaces."""
    workspaces = db.query(db_models.Workspace).filter(
        db_models.Workspace.owner_id == user_id
    ).all()
    return workspaces


@router.post("/workspaces", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(workspace: WorkspaceCreate, user_id: UUID = Query(...), db: Session = Depends(get_db)):
    """Create a new workspace."""
    ws = db_models.Workspace(
        name=workspace.name,
        description=workspace.description,
        owner_id=user_id,
        is_default=False,
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws


@router.get("/workspaces/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(workspace_id: UUID, user_id: UUID = Query(...), db: Session = Depends(get_db)):
    """Get workspace details."""
    ws = db.query(db_models.Workspace).filter(
        db_models.Workspace.id == workspace_id,
        db_models.Workspace.owner_id == user_id
    ).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return ws


# ── Resume ────────────────────────────────────────────────────────────
@router.post("/resumes/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    workspace_id: UUID = Form(...),
    user_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a resume file (PDF/DOCX)."""
    # Validate file type
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported"
        )

    # In production: upload to S3, start parsing job
    # For now: store metadata
    resume = db_models.Resume(
        workspace_id=workspace_id,
        user_id=user_id,
        source_file=f"uploads/{file.filename}",
        original_filename=file.filename,
        parse_status="pending",
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Queue parsing job (Celery task in production)
    # For MVP: return immediately, parsing happens async

    return resume


@router.get("/resumes", response_model=List[ResumeResponse])
async def list_resumes(workspace_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """List resumes in workspace."""
    resumes = db.query(db_models.Resume).filter(
        db_models.Resume.workspace_id == workspace_id
    ).all()
    return resumes


@router.get("/resumes/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Get resume details."""
    resume = db.query(db_models.Resume).filter(
        db_models.Resume.id == resume_id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@router.get("/resumes/{resume_id}/preview")
async def get_resume_preview(resume_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Get parsed resume preview with evidence spans."""
    resume = db.query(db_models.Resume).filter(
        db_models.Resume.id == resume_id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return {
        "raw_text": resume.raw_text[:5000] if resume.raw_text else None,
        "confirmed_data": resume.confirmed_data,
        "parse_warnings": resume.parse_warnings,
        "version": resume.version_counter,
    }


@router.post("/resumes/{resume_id}/confirm")
async def confirm_resume(resume_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Confirm parsed resume data and create version."""
    resume = db.query(db_models.Resume).filter(
        db_models.Resume.id == resume_id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Create version from confirmed data
    version = db_models.ResumeVersion(
        resume_id=resume.id,
        version_number=resume.version_counter + 1,
        content=json.dumps(resume.confirmed_data or {}),
        evidence_map={},
        status="approved",
    )
    db.add(version)

    resume.version_counter += 1
    resume.confirmed_at = datetime.utcnow()
    db.commit()

    return {"message": "Resume confirmed", "version": resume.version_counter}


@router.post("/resumes/{resume_id}/export")
async def export_resume(resume_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Export approved resume content as DOCX."""
    resume = db.query(db_models.Resume).filter(
        db_models.Resume.id == resume_id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # In production: generate DOCX from confirmed data
    # For now: return JSON
    return StreamingResponse(
        iter([json.dumps(resume.confirmed_data or {}).encode()]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=resume_{resume_id}.json"}
    )


# ── Job Description ──────────────────────────────────────────────────
@router.post("/jds/upload", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED)
async def upload_jd(
    workspace_id: UUID = Form(...),
    user_id: UUID = Form(...),
    file: UploadFile = File(None),
    jd_text: str = Form(None),
    db: Session = Depends(get_db)
):
    """Upload or paste a job description."""
    if not file and not jd_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either file or jd_text must be provided"
        )

    filename = file.filename if file else "pasted_jd.txt"

    jd = db_models.JobDescription(
        workspace_id=workspace_id,
        user_id=user_id,
        source_file=f"uploads/{filename}",
        original_filename=filename,
        raw_text=jd_text or "",
        parse_status="pending",
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)

    return jd


@router.get("/jds", response_model=List[JobDescriptionResponse])
async def list_jds(workspace_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """List job descriptions in workspace."""
    jds = db.query(db_models.JobDescription).filter(
        db_models.JobDescription.workspace_id == workspace_id
    ).all()
    return jds


@router.get("/jds/{jd_id}", response_model=JobDescriptionResponse)
async def get_jd(jd_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Get job description details."""
    jd = db.query(db_models.JobDescription).filter(
        db_models.JobDescription.id == jd_id
    ).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    return jd


@router.post("/jds/{jd_id}/confirm")
async def confirm_jd(jd_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Confirm parsed JD data."""
    jd = db.query(db_models.JobDescription).filter(
        db_models.JobDescription.id == jd_id
    ).first()
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")

    jd.confirmed_at = datetime.utcnow()
    jd.version += 1
    db.commit()

    return {"message": "JD confirmed", "version": jd.version}


# ── Resume-JD Analysis ───────────────────────────────────────────────
@router.post("/analyses", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(analysis: AnalysisCreate, db: Session = Depends(get_db)):
    """Create a new resume-JD analysis."""
    # Verify ownership
    resume = db.query(db_models.Resume).filter(
        db_models.Resume.id == analysis.resume_id
    ).first()
    jd = db.query(db_models.JobDescription).filter(
        db_models.JobDescription.id == analysis.job_description_id
    ).first()

    if not resume or not jd:
        raise HTTPException(status_code=404, detail="Resume or JD not found")

    if resume.user_id != analysis.user_id or jd.user_id != analysis.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    analysis_obj = db_models.ResumeJDAnalysis(
        workspace_id=resume.workspace_id,
        resume_id=analysis.resume_id,
        job_description_id=analysis.job_description_id,
        status="pending",
    )
    db.add(analysis_obj)
    db.commit()
    db.refresh(analysis_obj)

    # Queue analysis job (Celery task in production)
    # For MVP: return immediately

    return analysis_obj


@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Get analysis results."""
    analysis = db.query(db_models.ResumeJDAnalysis).filter(
        db_models.ResumeJDAnalysis.id == analysis_id
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


@router.get("/analyses/{analysis_id}/score")
async def get_score_breakdown(analysis_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Get detailed score breakdown with evidence."""
    analysis = db.query(db_models.ResumeJDAnalysis).filter(
        db_models.ResumeJDAnalysis.id == analysis_id
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "score": analysis.score,
        "methodology_version": analysis.methodology_version,
        "score_breakdown": analysis.score_breakdown,
        "confidence": analysis.confidence,
        "matched_evidence": analysis.gaps,  # or separate field
        "unmatched_requirements": analysis.gaps,
    }


@router.get("/analyses/{analysis_id}/gaps", response_model=GapAnalysisResponse)
async def get_gap_analysis(analysis_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Get gap analysis with suggested actions."""
    analysis = db.query(db_models.ResumeJDAnalysis).filter(
        db_models.ResumeJDAnalysis.id == analysis_id
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "gaps": analysis.gaps,
        "recommendations": analysis.recommendations,
    }


# ── Resume Optimizer ─────────────────────────────────────────────────
@router.get("/optimizer/suggestions", response_model=List[SuggestionResponse])
async def get_suggestions(analysis_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Get resume suggestions from gap analysis."""
    analysis = db.query(db_models.ResumeJDAnalysis).filter(
        db_models.ResumeJDAnalysis.id == analysis_id
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # In production: fetch from suggestion table
    # For MVP: return from analysis.recommendations
    return analysis.recommendations or []


@router.post("/optimizer/suggestions/{suggestion_id}/accept")
async def accept_suggestion(suggestion_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Accept a resume suggestion."""
    # In production: update suggestion status, create new resume version
    return {"message": "Suggestion accepted", "suggestion_id": str(suggestion_id)}


@router.post("/optimizer/suggestions/{suggestion_id}/reject")
async def reject_suggestion(suggestion_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Reject a resume suggestion (adds to rejection memory)."""
    # In production: update suggestion status, add to rejection memory
    return {"message": "Suggestion rejected", "suggestion_id": str(suggestion_id)}


@router.post("/optimizer/suggestions/{suggestion_id}/regenerate")
async def regenerate_suggestion(suggestion_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Regenerate a suggestion with different parameters."""
    # In production: call AI provider with modified context
    return {"message": "Suggestion regenerated", "suggestion_id": str(suggestion_id)}


@router.post("/optimizer/suggestions/{suggestion_id}/edit")
async def edit_suggestion(suggestion_id: UUID, user_id: UUID, edited_content: dict, db: Session = Depends(get_db)):
    """Edit a suggestion manually."""
    # In production: update suggestion, create new version
    return {"message": "Suggestion edited", "suggestion_id": str(suggestion_id)}


# ── Interview Preparation ────────────────────────────────────────────
@router.post("/questions/generate", response_model=List[InterviewQuestionResponse])
async def generate_questions(
    analysis_id: UUID,
    target_role: str,
    interview_round: str = "technical",
    difficulty: str = "mixed",
    user_id: UUID = None,
    db: Session = Depends(get_db)
):
    """Generate interview questions based on resume and JD."""
    # In production: call AI provider with question generation prompt
    # For MVP: return mock questions
    return []


@router.get("/questions/saved", response_model=List[InterviewQuestionResponse])
async def list_saved_questions(workspace_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """List saved question sets."""
    # In production: fetch from question set table
    return []


# ── Mock Interview ───────────────────────────────────────────────────
@router.post("/mock-interview", response_model=InterviewSessionResponse)
async def start_mock_interview(
    session: InterviewSessionCreate,
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """Start a new text mock interview session."""
    interview = db_models.InterviewSession(
        workspace_id=session.workspace_id,
        resume_id=session.resume_id,
        job_description_id=session.job_description_id,
        type=session.type,
        personality=session.personality,
        duration_minutes=session.duration_minutes,
        status="idle",
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    # Generate first question (server-side state machine)
    # In production: this would be done by a service

    return interview


@router.get("/mock-interview/{session_id}", response_model=InterviewSessionResponse)
async def get_mock_interview(session_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Get mock interview session state."""
    session = db.query(db_models.InterviewSession).filter(
        db_models.InterviewSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/mock-interview/{session_id}/question")
async def get_next_question(session_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Get the next question (server-side state machine)."""
    session = db.query(db_models.InterviewSession).filter(
        db_models.InterviewSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # In production: server-side state machine logic
    # Returns one active question at a time
    return {
        "question_id": "mock-question-id",
        "question": "Tell me about a challenging project you worked on.",
        "category": "behavioral",
        "difficulty": "medium",
    }


@router.post("/mock-interview/{session_id}/answer", response_model=InterviewAnswerResponse)
async def submit_answer(
    session_id: UUID,
    answer: InterviewAnswerCreate,
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """Submit an answer to the current question."""
    session = db.query(db_models.InterviewSession).filter(
        db_models.InterviewSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Create answer record
    ans = db_models.InterviewAnswer(
        question_id=answer.question_id,
        session_id=session_id,
        answer_text=answer.answer_text,
        transcript_uri=answer.transcript_uri,
    )
    db.add(ans)
    db.commit()
    db.refresh(ans)

    # In production: queue evaluation, determine if follow-up needed
    return ans


@router.post("/mock-interview/{session_id}/pause")
async def pause_interview(session_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Pause the interview session."""
    session = db.query(db_models.InterviewSession).filter(
        db_models.InterviewSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "paused"
    db.commit()
    return {"message": "Interview paused"}


@router.post("/mock-interview/{session_id}/resume")
async def resume_interview(session_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Resume a paused interview."""
    session = db.query(db_models.InterviewSession).filter(
        db_models.InterviewSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "active"
    db.commit()
    return {"message": "Interview resumed"}


@router.post("/mock-interview/{session_id}/complete")
async def complete_interview(session_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Complete the interview and generate final evaluation."""
    session = db.query(db_models.InterviewSession).filter(
        db_models.InterviewSession.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "generating_feedback"
    db.commit()

    # In production: generate evaluation, calculate score
    # For MVP: return mock evaluation
    session.status = "completed"
    session.completed_at = datetime.utcnow()
    session.score = 0.75
    db.commit()

    return {
        "overall_score": 0.75,
        "strengths": ["Clear communication", "Good technical depth"],
        "weaknesses": ["Could provide more specific metrics"],
        "confidence": 0.8,
    }


# ── Practice Arena ───────────────────────────────────────────────────
@router.post("/practice", response_model=PracticeSessionResponse)
async def start_practice(session: PracticeSessionCreate, user_id: UUID, db: Session = Depends(get_db)):
    """Start a practice session."""
    practice = db_models.PracticeSession(
        workspace_id=session.workspace_id,
        resume_id=session.resume_id,
        title=session.title,
        category=session.category,
        status="active",
    )
    db.add(practice)
    db.commit()
    db.refresh(practice)
    return practice


@router.get("/practice", response_model=List[PracticeSessionResponse])
async def list_practice_sessions(workspace_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """List practice sessions."""
    sessions = db.query(db_models.PracticeSession).filter(
        db_models.PracticeSession.workspace_id == workspace_id
    ).all()
    return sessions


# ── Readiness Dashboard ──────────────────────────────────────────────
@router.get("/readiness", response_model=ReadinessScoreResponse)
async def get_readiness(user_id: UUID, db: Session = Depends(get_db)):
    """Get readiness dashboard data."""
    # In production: calculate from latest analysis, interview history, etc.
    return {
        "overall_score": 0.65,
        "component_scores": {
            "resume": 0.7,
            "jd_match": 0.6,
            "technical": 0.65,
            "behavioral": 0.7,
            "communication": 0.75,
        },
        "methodology_version": "v1.0.0",
        "status": "partial",
        "insufficient_evidence": ["product", "portfolio"],
        "next_best_action": {
            "action": "Take a mock interview",
            "rationale": "Interview practice is the lowest scored area with sufficient data",
            "direct_path": "/mock-interview/new",
        },
    }


# ── Profile & Settings ───────────────────────────────────────────────
@router.get("/profile/settings")
async def get_settings(user_id: UUID, db: Session = Depends(get_db)):
    """Get user settings and privacy controls."""
    user = db.query(db_models.User).filter(db_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "name": user.name,
        "email": user.email,
        "audio_retention_days": 30,
        "transcript_retention_days": 90,
        "data_export_available": True,
        "delete_account_available": True,
    }


@router.post("/profile/export")
async def export_user_data(user_id: UUID, db: Session = Depends(get_db)):
    """Export all user data."""
    # In production: generate comprehensive export
    return StreamingResponse(
        iter([b'{"data": "exported"}']),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=user_data_{user_id}.json"}
    )


@router.delete("/profile")
async def delete_user(user_id: UUID, db: Session = Depends(get_db)):
    """Delete user account and all data."""
    user = db.query(db_models.User).filter(db_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # In production: soft delete, queue hard deletion, preserve audit trail
    db.delete(user)
    db.commit()

    return {"message": "Account scheduled for deletion"}