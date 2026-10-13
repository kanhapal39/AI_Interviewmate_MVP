"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Recommendation {
  id: string;
  original: string;
  ai_suggestion: string;
  reason: string;
  confidence: number;
  evidence_map: { source: string; section: string };
  should_export: boolean;
}

interface Analysis {
  id: string;
  score: number;
  recommendations: Recommendation[];
}

export default function ResumeOptimizerPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id as string;
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
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
          {
            id: "rec-3",
            original: "Led team of 4 engineers",
            ai_suggestion: "Led cross-functional team of 4 engineers delivering 3 major features per quarter with 99.9% uptime",
            reason: "Add measurable outcomes and scale metrics as mentioned in JD leadership requirements",
            confidence: 0.88,
            evidence_map: { source: "jd", section: "responsibilities" },
            should_export: false,
          },
        ],
      });
      setLoading(false);
    }, 500);
  }, [analysisId]);

  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

  const handleAccept = (id: string) => {
    setAccepted(prev => ({ ...prev, [id]: true }));
  };

  const handleReject = (id: string) => {
    setAccepted(prev => ({ ...prev, [id]: false }));
  };

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
            <Link href={`/analysis/${analysisId}`} className="btn-secondary text-sm">← Back to Analysis</Link>
            <Link href={`/analysis/${analysisId}/gaps`} className="btn-secondary text-sm">Gap Analysis</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="container-main">
          <div className="stack-lg mb-8">
            <h1 className="text-headline-lg">Resume Optimizer</h1>
            <p className="text-body-md text-on-surface-variant">
              AI-generated suggestions to improve your resume for this job
            </p>
          </div>

          <div className="glass-card p-6 stack-md mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-title-md font-medium">Suggestions</h2>
              <div className="flex items-center gap-2">
                <span className="status-chip status-chip-info">
                  {analysis?.recommendations?.length || 0} suggestions
                </span>
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Review each suggestion. Accepted changes will be included when you export your optimized resume.
            </p>
          </div>

          <div className="space-y-4">
            {analysis?.recommendations?.map((rec) => (
              <div key={rec.id} className="glass-card p-6 stack-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
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
                  <button
                    onClick={() => handleAccept(rec.id)}
                    className={`btn-primary text-sm ${accepted[rec.id] === true ? "bg-green-600" : ""}`}
                    disabled={accepted[rec.id] !== undefined}
                  >
                    {accepted[rec.id] === true ? "✓ Accepted" : "Accept"}
                  </button>
                  <button
                    onClick={() => handleReject(rec.id)}
                    className={`btn-secondary text-sm ${accepted[rec.id] === false ? "bg-red-600" : ""}`}
                    disabled={accepted[rec.id] !== undefined}
                  >
                    {accepted[rec.id] === false ? "✗ Rejected" : "Reject"}
                  </button>
                  <button className="btn-secondary text-sm">Edit</button>
                  <button className="btn-secondary text-sm">Regenerate</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <Link href={`/analysis/${analysisId}`} className="btn-secondary">← Back to Overview</Link>
            <Link href={`/mock-interview/new?analysis=${analysisId}`} className="btn-primary">Start Mock Interview</Link>
          </div>
        </div>
      </main>
    </div>
  );
}