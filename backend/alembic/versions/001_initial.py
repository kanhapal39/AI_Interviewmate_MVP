"""Initial migration - create all InterviewMate tables"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_is_active', 'users', ['is_active'])

    # Workspaces
    op.create_table(
        'workspaces',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, default=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_workspaces_owner', 'workspaces', ['owner_id'])

    # Resumes
    op.create_table(
        'resumes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source_file', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=False),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('parse_status', sa.String(50), nullable=False, default='pending'),
        sa.Column('parse_warnings', sa.JSON(), nullable=True),
        sa.Column('version_counter', sa.Integer(), nullable=False, default=0),
        sa.Column('confirmed_version', sa.Integer(), nullable=False, default=0),
        sa.Column('confirmed_data', sa.JSON(), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_resumes_workspace', 'resumes', ['workspace_id'])
    op.create_index('ix_resumes_parse_status', 'resumes', ['parse_status'])

    # Resume Versions
    op.create_table(
        'resume_versions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('evidence_map', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, default='approved'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Job Descriptions
    op.create_table(
        'job_descriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source_file', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=False),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('parse_status', sa.String(50), nullable=False, default='pending'),
        sa.Column('parse_warnings', sa.JSON(), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, default=1),
        sa.Column('confirmed_data', sa.JSON(), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_jobdescriptions_workspace', 'job_descriptions', ['workspace_id'])

    # Resume-JD Analyses
    op.create_table(
        'resume_jd_analyses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('job_description_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('methodology_version', sa.String(50), nullable=False, default='v1.0.0'),
        sa.Column('score_breakdown', sa.JSON(), nullable=True),
        sa.Column('gaps', sa.JSON(), nullable=True),
        sa.Column('recommendations', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, default='pending'),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('model_version', sa.String(100), nullable=True),
        sa.Column('prompt_version', sa.String(50), nullable=False, default='v1.0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['job_description_id'], ['job_descriptions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_resume_jd_analysis', 'resume_jd_analyses', ['resume_id', 'job_description_id'])

    # Skills
    op.create_table(
        'skills',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('level', sa.String(50), nullable=True),
        sa.Column('years_experience', sa.Float(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Resume-Skills association
    op.create_table(
        'resume_skills',
        sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('skill_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('resume_id', 'skill_id')
    )

    # JD-Skills association
    op.create_table(
        'jd_skills',
        sa.Column('jd_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('skill_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['jd_id'], ['job_descriptions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('jd_id', 'skill_id')
    )

    # Skill Gaps
    op.create_table(
        'skill_gaps',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('job_description_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('skill_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('gap_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(50), nullable=False),
        sa.Column('evidence_from_jd', sa.Text(), nullable=True),
        sa.Column('suggested_action', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['job_description_id'], ['job_descriptions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_skill_gaps_resume_jd', 'skill_gaps', ['resume_id', 'job_description_id', 'skill_id'])

    # Interview Sessions
    op.create_table(
        'interview_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('job_description_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('personality', sa.String(50), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, default='idle'),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['job_description_id'], ['job_descriptions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_interview_sessions_resume', 'interview_sessions', ['resume_id'])

    # Interview Questions
    op.create_table(
        'interview_questions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('difficulty', sa.String(50), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('rubric', sa.JSON(), nullable=True),
        sa.Column('expected_answer_signals', sa.JSON(), nullable=True),
        sa.Column('competency', sa.String(255), nullable=True),
        sa.Column('source_references', sa.JSON(), nullable=True),
        sa.Column('relevance_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_interview_questions_session', 'interview_questions', ['session_id', 'sequence'])

    # Interview Answers
    op.create_table(
        'interview_answers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('answer_text', sa.Text(), nullable=False),
        sa.Column('transcript_uri', sa.String(500), nullable=True),
        sa.Column('submission_time', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('follow_up_allowed', sa.Boolean(), nullable=False, default=True),
        sa.Column('follow_up_count', sa.Integer(), nullable=False, default=0),
        sa.Column('max_follow_ups', sa.Integer(), nullable=False, default=3),
        sa.Column('scores', sa.JSON(), nullable=True),
        sa.Column('evidence', sa.JSON(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['interview_questions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_interview_answers_question', 'interview_answers', ['question_id'])

    # Interview Evaluations
    op.create_table(
        'interview_evaluations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('answer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=True),
        sa.Column('strengths', sa.JSON(), nullable=True),
        sa.Column('weaknesses', sa.JSON(), nullable=True),
        sa.Column('missing_points', sa.JSON(), nullable=True),
        sa.Column('better_answer_guidance', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('rubric_applied', sa.String(100), nullable=True),
        sa.Column('model_version', sa.String(100), nullable=True),
        sa.Column('prompt_version', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['answer_id'], ['interview_answers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['interview_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_interview_evaluations_answer', 'interview_evaluations', ['answer_id'])

    # Practice Sessions
    op.create_table(
        'practice_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, default='active'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_practice_sessions_workspace', 'practice_sessions', ['workspace_id'])

    # Challenge Attempts (deferred)
    op.create_table(
        'challenge_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('attempt_number', sa.Integer(), nullable=False, default=1),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Portfolios
    op.create_table(
        'portfolios',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Portfolio Projects
    op.create_table(
        'portfolio_projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('portfolio_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('url', sa.String(500), nullable=True),
        sa.Column('github_url', sa.String(500), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['portfolio_id'], ['portfolios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Readiness Scores
    op.create_table(
        'readiness_scores',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('overall_score', sa.Float(), nullable=True),
        sa.Column('component_scores', sa.JSON(), nullable=True),
        sa.Column('methodology_version', sa.String(50), nullable=False, default='v1.0.0'),
        sa.Column('evidence_count', sa.Integer(), nullable=False, default=0),
        sa.Column('total_possible', sa.Integer(), nullable=False, default=0),
        sa.Column('status', sa.String(50), nullable=False, default='partial'),
        sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_readiness_scores_user', 'readiness_scores', ['user_id'])

    # User Progress
    op.create_table(
        'user_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resume_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('milestone', sa.String(100), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False, default=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_progress_user', 'user_progress', ['user_id', 'milestone'])

    # Audit Events
    op.create_table(
        'audit_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_events_user', 'audit_events', ['user_id', 'created_at'])

    # AI Requests
    op.create_table(
        'ai_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('prompt_version', sa.String(50), nullable=False),
        sa.Column('model_name', sa.String(100), nullable=False),
        sa.Column('task_type', sa.String(50), nullable=False),
        sa.Column('input_context_summary', sa.Text(), nullable=True),
        sa.Column('output_schema', sa.JSON(), nullable=True),
        sa.Column('output_validated', sa.Boolean(), nullable=False, default=False),
        sa.Column('output_valid_error', sa.Text(), nullable=True),
        sa.Column('tokens_used_input', sa.Integer(), nullable=True),
        sa.Column('tokens_used_output', sa.Integer(), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('cost_estimate', sa.Float(), nullable=True),
        sa.Column('model_response', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ai_requests_user_workspace', 'ai_requests', ['user_id', 'workspace_id', 'created_at'])
    op.create_index('ix_ai_requests_status', 'ai_requests', ['status'])


def downgrade() -> None:
    # Drop in reverse order due to foreign keys
    op.drop_table('ai_requests')
    op.drop_table('audit_events')
    op.drop_table('user_progress')
    op.drop_table('readiness_scores')
    op.drop_table('portfolio_projects')
    op.drop_table('portfolios')
    op.drop_table('challenge_attempts')
    op.drop_table('practice_sessions')
    op.drop_table('interview_evaluations')
    op.drop_table('interview_answers')
    op.drop_table('interview_questions')
    op.drop_table('interview_sessions')
    op.drop_table('skill_gaps')
    op.drop_table('jd_skills')
    op.drop_table('resume_skills')
    op.drop_table('skills')
    op.drop_table('resume_jd_analyses')
    op.drop_table('job_descriptions')
    op.drop_table('resume_versions')
    op.drop_table('resumes')
    op.drop_table('workspaces')
    op.drop_table('users')