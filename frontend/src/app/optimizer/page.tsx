"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type OptimizerTab = "suggestions" | "versions" | "export";

interface Suggestion {
  id: string;
  original: string;
  ai_suggestion: string;
  reason: string;
  confidence?: number;
  evidence_map?: { source?: string; section?: string; quote?: string };
  status: "pending" | "accepted" | "rejected";
  mock_mode?: boolean;
}

function OptimizerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysis");
  const [tab, setTab] = useState<OptimizerTab>("suggestions");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
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

  // Fetch suggestions for the analysis
  useEffect(() => {
    if (!analysisId) {
      setLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${API_BASE}/optimizer/suggestions?analysis_id=${analysisId}`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to fetch suggestions");
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data.map((s: any, i: number) => ({
            id: s.id || `sug-${i}`,
            original: s.original || "",
            ai_suggestion: s.ai_suggestion || "",
            reason: s.reason || "",
            confidence: s.confidence,
            evidence_map: s.evidence_map,
            status: "pending" as const,
            mock_mode: s.mock_mode || false,
          })));
          setMockMode(data.some((s: any) => s.mock_mode));
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load suggestions");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [analysisId]);

  const tabs: { id: OptimizerTab; label: string }[] = [
    { id: "suggestions", label: "Suggestions" },
    { id: "versions", label: "Versions" },
    { id: "export", label: "Export" },
  ];

  const handleAccept = (id: string) => {
    setSuggestions(suggestions.map((s) =>
      s.id === id ? { ...s, status: "accepted" as const } : s
    ));
  };

  const handleReject = (id: string) => {
    setSuggestions(suggestions.map((s) =>
      s.id === id ? { ...s, status: "rejected" as const } : s
    ));
  };

  const handleRegenerate = (id: string) => {
    alert("Regenerating suggestion");
  };

  const acceptedCount = suggestions.filter((s) => s.status === "accepted").length;

  if (!analysisId) {
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
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            <div className="glass-card p-8 stack-lg">
              <h1 className="text-headline-lg">Resume Optimizer</h1>
              <p className="text-body-md text-on-surface-variant">
                Select an analysis from the <Link href="/analysis/new" className="text-primary font-medium hover:underline">Analysis page</Link> to view suggestions.
              </p>
              <Link href="/analysis/new" className="btn-primary mt-6 inline-block">
                Create New Analysis
              </Link>
            </div>
          </div>
        </main>
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
                {t.label}
                {tab === "suggestions" && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 rounded-full">
                    {suggestions.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="container-main">
          <div className="stack-lg mb-8">
            <h1 className="text-headline-lg">Resume Optimizer</h1>
            <p className="text-body-md text-on-surface-variant">
              Review AI-generated suggestions based on your resume and job description.
              Each suggestion is evidence-linked and requires your approval before export.
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

          {tab === "suggestions" && (
            <div className="stack-lg">
              {loading && (
                <div className="glass-card p-8 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-body-md text-on-surface-variant">Loading suggestions...</p>
                </div>
              )}

              {error && (
                <div className="glass-card p-6 bg-red-50 border-red-200 stack-md">
                  <p className="text-red-800"><strong>Error:</strong> {error}</p>
                  <p className="text-body-sm text-red-700">
                    The analysis may have failed or the data may not be available yet.
                  </p>
                </div>
              )}

              {!loading && !error && suggestions.length === 0 && (
                <div className="glass-card p-8 text-center stack-md">
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-3xl">
                    📝
                  </div>
                  <h3 className="text-title-md font-medium">No Suggestions Yet</h3>
                  <p className="text-body-md text-on-surface-variant">
                    The analysis completed but no specific improvements were identified.
                    This may mean your resume already aligns well with the job description.
                  </p>
                </div>
              )}

              {!loading && !error && suggestions.length > 0 && (
                <div className="stack-lg">
                  {/* Progress Bar */}
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="label-sm">Progress</span>
                      <span className="label-sm">
                        {acceptedCount} of {suggestions.length} accepted
                      </span>
                    </div>
                    <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500"
                        style={{ width: suggestions.length > 0 ? `${(acceptedCount / suggestions.length) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>

                  {/* Suggestions List */}
                  <div className="space-y-4">
                    {suggestions.map((sug) => (
                      <div
                        key={sug.id}
                        className={`glass-card p-6 stack-md ${
                          sug.status === "accepted"
                            ? "border-l-4 border-l-green-500"
                            : sug.status === "rejected"
                            ? "border-l-4 border-l-red-500 opacity-60"
                            : ""
                        }`}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="stack-sm">
                            <div className="flex items-center gap-2">
                              <p className="label-sm text-on-surface-variant">Original</p>
                              {sug.status !== "pending" && (
                                <span
                                  className={`status-chip ${
                                    sug.status === "accepted"
                                      ? "status-chip-success"
                                      : "status-chip-error"
                                  } text-xs`}
                                >
                                  {sug.status}
                                </span>
                              )}
                            </div>
                            <p className="text-body-md font-mono text-sm bg-surface-container p-3 rounded-md">
                              {sug.original}
                            </p>
                          </div>

                          <div className="stack-sm">
                            <div className="flex items-center gap-2">
                              <p className="label-sm text-on-surface-variant">AI Suggestion</p>
                              {sug.confidence !== undefined && (
                                <span className="status-chip status-chip-info text-xs">
                                  {Math.round(sug.confidence * 100)}% match
                                </span>
                              )}
                              {sug.mock_mode && (
                                <span className="status-chip status-chip-warning text-xs">
                                  Mock Data
                                </span>
                              )}
                            </div>
                            <p className="text-body-md bg-primary/5 p-3 rounded-md border border-primary/20">
                              {sug.ai_suggestion}
                            </p>
                          </div>

                          <div className="stack-sm">
                            <p className="label-sm text-on-surface-variant">Reason & Evidence</p>
                            <div className="p-3 bg-surface-container rounded-md stack-xs">
                              <p className="text-body-sm">{sug.reason}</p>
                              {sug.evidence_map?.quote && (
                                <div className="text-xs text-on-surface-variant">
                                  <strong>Evidence:</strong> {sug.evidence_map.quote}
                                </div>
                              )}
                              {sug.evidence_map?.source && (
                                <div className="text-xs text-on-surface-variant">
                                  <strong>Source:</strong> {sug.evidence_map.source} › {sug.evidence_map.section}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {sug.status === "pending" && (
                          <div className="flex gap-2 pt-4 border-t border-border">
                            <button
                              onClick={() => handleAccept(sug.id)}
                              className="btn-primary text-sm flex-1"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(sug.id)}
                              className="btn-secondary text-sm flex-1"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleRegenerate(sug.id)}
                              className="btn-secondary text-sm"
                            >
                              Regenerate
                            </button>
                          </div>
                        )}

                        {sug.status !== "pending" && (
                          <div className="pt-4 border-t border-border">
                            <p className="text-body-sm text-on-surface-variant">
                              {sug.status === "accepted"
                                ? "✓ Accepted — will be included in export"
                                : "✕ Rejected — added to rejection memory (won't be re-suggested)"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {suggestions.every((s) => s.status !== "pending") && (
                    <div className="glass-card p-6 text-center bg-green-50 border-green-200">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto text-2xl text-green-600 mb-4">
                        ✓
                      </div>
                      <h3 className="text-title-md font-medium text-green-800">All Suggestions Reviewed!</h3>
                      <p className="text-body-md text-green-700 mt-2">
                        You've reviewed all {suggestions.length} suggestions.
                        {acceptedCount} accepted, {suggestions.length - acceptedCount} rejected.
                      </p>
                      <Link href="/optimizer?tab=export" className="btn-primary mt-4 inline-block">
                        Export Resume
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "versions" && (
            <div className="glass-card p-6 stack-lg">
              <h2 className="text-title-md font-medium mb-4">Resume Versions</h2>
              <p className="text-body-md text-on-surface-variant mb-6">
                Version history will appear here after you accept suggestions and export.
              </p>
              <div className="space-y-4">
                {[
                  { version: 1, date: "Initial", status: "Original", changes: "Initial upload" },
                ].map((v, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      i === 0 ? "bg-primary/5 border-primary" : "bg-surface-container"
                    } flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center font-bold text-primary">
                        v{v.version}
                      </div>
                      <div className="stack-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{v.status}</span>
                          {i === 0 && <span className="status-chip status-chip-success text-xs">Current</span>}
                        </div>
                        <p className="text-body-sm text-on-surface-variant">{v.changes}</p>
                        <p className="text-body-xs text-on-surface-variant">{v.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "export" && (
            <div className="glass-card p-6 stack-lg max-w-2xl">
              <h2 className="text-title-md font-medium mb-4">Export Resume</h2>
              <p className="text-body-md text-on-surface-variant mb-6">
                Export your optimized resume. Only <strong>accepted</strong> suggestions will be included.
                Rejected suggestions are preserved in rejection memory and will not be re-introduced.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-surface-container rounded-lg flex items-center justify-between">
                  <div className="stack-xs">
                    <p className="font-medium">DOCX Format</p>
                    <p className="text-body-sm text-on-surface-variant">
                      Microsoft Word compatible, ready for applications
                    </p>
                  </div>
                  <button className="btn-primary" disabled={acceptedCount === 0}>
                    {acceptedCount === 0 ? "Accept suggestions first" : "Download DOCX"}
                  </button>
                </div>

                <div className="p-4 bg-surface-container rounded-lg flex items-center justify-between">
                  <div className="stack-xs">
                    <p className="font-medium">JSON (Machine Readable)</p>
                    <p className="text-body-sm text-on-surface-variant">
                      Structured data for ATS systems and programmatic use
                    </p>
                  </div>
                  <button className="btn-secondary" disabled={acceptedCount === 0}>
                    {acceptedCount === 0 ? "Accept suggestions first" : "Download JSON"}
                  </button>
                </div>

                <div className="p-4 bg-surface-container rounded-lg flex items-center justify-between">
                  <div className="stack-xs">
                    <p className="font-medium">PDF</p>
                    <p className="text-body-sm text-on-surface-variant">
                      Print-ready format with professional styling
                    </p>
                  </div>
                  <button className="btn-secondary" disabled={acceptedCount === 0}>
                    {acceptedCount === 0 ? "Accept suggestions first" : "Download PDF"}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg stack-sm mt-6">
                <h4 className="font-medium text-amber-800">Export Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-amber-700">Accepted Suggestions</p>
                    <p className="font-bold text-amber-900">{acceptedCount}</p>
                  </div>
                  <div>
                    <p className="text-amber-700">Rejected (in memory)</p>
                    <p className="font-bold text-amber-900">{suggestions.length - acceptedCount}</p>
                  </div>
                  <div>
                    <p className="text-amber-700">Version</p>
                    <p className="font-bold text-amber-900">v{suggestions.length + 1}</p>
                  </div>
                  <div>
                    <p className="text-amber-700">Export Status</p>
                    <p className="font-bold text-green-700">{acceptedCount > 0 ? "Ready" : "Pending"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OptimizerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <OptimizerContent />
    </Suspense>
  );
}