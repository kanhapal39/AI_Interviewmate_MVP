"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type AnalysisTab = "overview" | "score" | "gaps" | "optimizer";

export default function AnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id as string;
  const [tab, setTab] = useState<AnalysisTab>("overview");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/auth/signin");
    }
  }, [router]);

  useEffect(() => {
    setTimeout(() => {
      setAnalysis({
        id: analysisId,
        score: 0.73,
        methodology_version: "v1.0.0",
        confidence: 0.82,
        score_breakdown: {
          skills: 0.8,
          experience: 0.7,
          keywords: 0.65,
          responsibilities: 0.75,
          education: 0.8,
          tools_technology: 0.7,
          role_specific: 0.6,
        },
        gaps: [
          {
            id: "gap-1",
            gap: "Kubernetes experience",
            why_it_matters: "Required for deploying and managing containerized applications in production",
            evidence_from_jd: "Must have experience with Kubernetes orchestration",
            suggested_action: "Add Kubernetes projects or certifications to resume",
            severity: "critical",
          },
          {
            id: "gap-2",
            gap: "GraphQL API design",
            why_it_matters: "Preferred skill for modern API development",
            evidence_from_jd: "Experience with GraphQL is a plus",
            suggested_action: "Highlight any GraphQL experience or add a learning project",
            severity: "minor",
          },
        ],
        recommendations: [
          {
            id: "rec-1",
            original: "Built microservices using Docker",
            ai_suggestion: "Built and deployed microservices using Docker and Kubernetes on AWS EKS",
            reason: "JD requires Kubernetes; Docker alone doesn't demonstrate orchestration experience",
            confidence: 0.85,
            evidence_map: { source: "jd", section: "requirements" },
            should_export: false,
          },
          {
            id: "rec-2",
            original: "5 years of React experience",
            ai_suggestion: "5+ years building production React applications with TypeScript, including performance optimization and state management with Redux/Zustand",
            reason: "Add specificity about TypeScript and state management mentioned in JD",
            confidence: 0.9,
            evidence_map: { source: "jd", section: "required_skills" },
            should_export: false,
          },
        ],
      });
      setLoading(false);
    }, 500);
  }, [analysisId]);

  const tabs: { id: AnalysisTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "score", label: "Score Detail", icon: "📈" },
    { id: "gaps", label: "Gap Analysis", icon: "🔍" },
    { id: "optimizer", label: "Resume Optimizer", icon: "✨" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container-main h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">InterviewMate</Link>
          <nav className="flex items-center gap-4">
            <Link href="/readiness" className="btn-secondary text-sm">Readiness</Link>
            <Link href="/mock-interview/new" className="btn-primary text-sm">Mock Interview</Link>
          </nav>
        </div>

        <div className="container-main">
          <div className="flex gap-1 pb-4 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{t.icon}</span>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="container-main">
          <div className="stack-lg mb-8">
            <h1 className="text-headline-lg">Analysis Results</h1>
            <p className="text-body-md text-on-surface-variant">
              Estimated Compatibility
            </p>
          </div>

          {tab === "overview" && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Score Card */}
                <div className="glass-card p-6 stack-lg lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-title-md font-medium">Overall Match Score</h3>
                    <span className="status-chip status-chip-info">Methodology v1.0.0</span>
                  </div>
                  <div className="relative w-48 h-48 mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="96" cy="96" r="88" fill="none" stroke="#e5eeff" strokeWidth="12" />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(analysis?.score || 0) * 553}`}
                        strokeDashoffset="0"
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4648d4" />
                          <stop offset="100%" stopColor="#6063ee" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-on-surface">
                        {Math.round((analysis?.score || 0) * 100)}%
                      </span>
                      <span className="text-body-sm text-on-surface-variant">Estimated Compatibility</span>
                    </div>
                  </div>
                  <p className="text-body-sm text-on-surface-variant text-center">
                    Confidence: {Math.round((analysis?.confidence || 0) * 100)}%
                  </p>
                </div>

                {/* Component Breakdown */}
                <div className="glass-card p-6 stack-lg lg:col-span-2">
                  <h3 className="text-title-md font-medium">Component Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(analysis?.score_breakdown || {}).map(([component, score]) => (
                      <div key={component} className="stack-xs">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{component.replace("_", " ")}</span>
                          <span className="font-medium">{Math.round((score as number) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-1000"
                            style={{ width: `${(score as number) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-body-sm text-on-surface-variant pt-4">
                    <strong>Weights:</strong> Skills 25% • Experience 20% • Keywords 15% •
                    Responsibilities 15% • Education 10% • Tools/Technology 10% • Role-Specific 5%
                  </p>
                </div>

                {/* Quick Actions - spans all 3 columns */}
                <div className="glass-card p-6 stack-md lg:col-span-3">
                  <h3 className="text-title-md font-medium">Next Steps</h3>
                  <div className="flex flex-wrap gap-4">
                    <Link href={`/analysis/${analysisId}/gaps`} className="btn-primary">View Gap Analysis</Link>
                    <Link href={`/analysis/${analysisId}/optimizer`} className="btn-secondary">Open Resume Optimizer</Link>
                    <Link href={`/mock-interview/new?analysis=${analysisId}`} className="btn-primary">Start Mock Interview</Link>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card p-6 stack-md">
                <h3 className="text-title-md font-medium">Next Steps</h3>
                <div className="flex flex-wrap gap-4">
                  <Link href={`/analysis/${analysisId}/gaps`} className="btn-primary">View Gap Analysis</Link>
                  <Link href={`/analysis/${analysisId}/optimizer`} className="btn-secondary">Open Resume Optimizer</Link>
                  <Link href={`/mock-interview/new?analysis=${analysisId}`} className="btn-primary">Start Mock Interview</Link>
                </div>
              </div>
            </div>
          )}

          {tab === "score" && (
            <div className="glass-card p-6 stack-lg">
              <h2 className="text-title-md font-medium mb-4">Detailed Score Breakdown</h2>
              <div className="stack-md">
                <div className="p-4 bg-surface-container rounded-lg">
                  <h4 className="font-medium mb-2">Methodology v{analysis?.methodology_version}</h4>
                  <p className="text-body-sm text-on-surface-variant mb-4">
                    This score is calculated deterministically using a weighted formula.
                    It is <strong>not</strong> an actual ATS vendor score.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(analysis?.score_breakdown || {}).map(([component, score]) => (
                      <div key={component} className="p-3 bg-background rounded-md">
                        <p className="text-body-sm text-on-surface-variant capitalize">{component.replace("_", " ")}</p>
                        <p className="text-2xl font-bold text-primary">{Math.round((score as number) * 100)}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg stack-sm">
                  <h4 className="font-medium text-amber-800">Important Disclaimer</h4>
                  <p className="text-body-sm text-amber-700">
                    This "Estimated Compatibility" is a proprietary metric calculated by InterviewMate.
                    It is not affiliated with, endorsed by, or validated by any ATS vendor.
                    The score represents our algorithm's assessment of keyword and semantic
                    alignment between your resume and the job description.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === "gaps" && (
            <div className="stack-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-title-md font-medium">Gap Analysis</h2>
                <span className="text-body-sm text-on-surface-variant">{analysis?.gaps?.length || 0} gaps identified</span>
              </div>
              <div className="space-y-4">
                {analysis?.gaps?.map((gap: any) => (
                  <div key={gap.id} className="glass-card p-6 stack-md border-l-4 border-l-primary">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 stack-sm">
                        <h4 className="text-title-md font-medium">{gap.gap}</h4>
                        <p className="text-body-sm text-on-surface-variant">{gap.why_it_matters}</p>
                        <div className="p-3 bg-surface-container rounded-md stack-xs">
                          <p className="font-medium text-on-surface-variant">JD Evidence:</p>
                          <p className="text-body-sm">{gap.evidence_from_jd}</p>
                        </div>
                        <p className="text-body-sm"><strong>Suggested Action:</strong> {gap.suggested_action}</p>
                      </div>
                      <span className={`status-chip ${gap.severity === "critical" ? "status-chip-error" : gap.severity === "important" ? "status-chip-warning" : "status-chip-info"}`}>
                        {gap.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "optimizer" && (
            <div className="stack-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-title-md font-medium">Resume Optimizer</h2>
                <span className="text-body-sm text-on-surface-variant">{analysis?.recommendations?.length || 0} suggestions</span>
              </div>
              <div className="space-y-4">
                {analysis?.recommendations?.map((rec: any) => (
                  <div key={rec.id} className="glass-card p-6 stack-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="label-sm text-on-surface-variant">Original</p>
                        <p className="text-body-md font-mono text-sm bg-surface-container p-3 rounded-md">{rec.original}</p>
                      </div>
                      <div>
                        <p className="label-sm text-on-surface-variant">AI Suggestion</p>
                        <p className="text-body-md bg-primary/5 p-3 rounded-md border border-primary/20">{rec.ai_suggestion}</p>
                      </div>
                      <div>
                        <p className="label-sm text-on-surface-variant">Reason</p>
                        <p className="text-body-sm text-on-surface-variant">{rec.reason}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="status-chip status-chip-info">Confidence: {Math.round(rec.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <button className="btn-primary text-sm">Accept</button>
                      <button className="btn-secondary text-sm">Reject</button>
                      <button className="btn-secondary text-sm">Edit</button>
                      <button className="btn-secondary text-sm">Regenerate</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}