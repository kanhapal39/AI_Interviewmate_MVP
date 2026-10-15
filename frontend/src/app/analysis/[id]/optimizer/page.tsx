"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Recommendation {
  id: string;
  original: string;
  ai_suggestion: string;
  reason: string;
  confidence?: number;
  evidence_map?: { source?: string; section?: string };
  should_export: boolean;
  mock_mode?: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/auth/signin");
    }
  }, [router]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${API_BASE}/optimizer/suggestions?analysis_id=${analysisId}`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to fetch analysis");
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setAnalysis({
            id: analysisId,
            score: 0,
            recommendations: data.map((s: any, i: number) => ({
              id: s.id || `rec-${i}`,
              original: s.original || "",
              ai_suggestion: s.ai_suggestion || "",
              reason: s.reason || "",
              confidence: s.confidence,
              evidence_map: s.evidence_map,
              should_export: false,
              mock_mode: s.mock_mode || false,
            })),
          });
          setMockMode(data.some((s: any) => s.mock_mode));
        } else {
          setAnalysis({ id: analysisId, score: 0, recommendations: [] });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
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

          {mockMode && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg stack-sm">
              <p className="text-amber-800">
                <strong>Mock Mode Active:</strong> Suggestions shown are test data.
                Set <code>ENABLE_MOCK_PROVIDER=false</code> and provide API keys for real AI analysis.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 glass-card p-4 bg-red-50 border-red-200 stack-sm">
              <p className="text-red-800"><strong>Error:</strong> {error}</p>
            </div>
          )}

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

          {!error && (!analysis?.recommendations || analysis.recommendations.length === 0) && (
            <div className="glass-card p-8 text-center stack-md">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-3xl">
                📝
              </div>
              <h3 className="text-title-md font-medium">No Suggestions</h3>
              <p className="text-body-md text-on-surface-variant">
                The analysis completed but no specific improvements were identified.
                This may mean your resume already aligns well with the job description.
              </p>
            </div>
          )}

          {analysis?.recommendations && analysis.recommendations.length > 0 && (
            <div className="space-y-4">
              {analysis.recommendations.map((rec) => (
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
                        {rec.confidence !== undefined && (
                          <span className="status-chip status-chip-info">Match: {Math.round(rec.confidence * 100)}%</span>
                        )}
                        {rec.mock_mode && (
                          <span className="status-chip status-chip-warning">Mock Data</span>
                        )}
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
          )}

          <div className="mt-8 flex gap-4">
            <Link href={`/analysis/${analysisId}`} className="btn-secondary">← Back to Overview</Link>
            <Link href={`/mock-interview/new?analysis=${analysisId}`} className="btn-primary">Start Mock Interview</Link>
          </div>
        </div>
      </main>
    </div>
  );
}