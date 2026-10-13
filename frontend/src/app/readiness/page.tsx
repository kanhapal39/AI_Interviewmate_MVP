"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReadinessPage() {
  const router = useRouter();
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/auth/signin");
    }
  }, [router]);

  useEffect(() => {
    // In production: fetch from API
    setTimeout(() => {
      setReadiness({
        overall_score: 0.68,
        methodology_version: "v1.0.0",
        status: "partial",
        component_scores: {
          resume: 0.75,
          jd_match: 0.73,
          technical: 0.65,
          product: 0.6,
          communication: 0.72,
          behavioral: 0.68,
          portfolio: 0.4,
        },
        insufficient_evidence: ["portfolio", "product"],
        practice_history: [
          { id: "p1", date: "2024-01-10", type: "System Design", score: 0.7, status: "completed" },
          { id: "p2", date: "2024-01-08", type: "Behavioral", score: 0.75, status: "completed" },
          { id: "p3", date: "2024-01-05", type: "Technical", score: 0.65, status: "completed" },
        ],
        mock_interviews: [
          { id: "m1", date: "2024-01-12", score: 0.78, status: "completed" },
          { id: "m2", date: "2024-01-03", score: 0.72, status: "completed" },
        ],
        resume_improvements: [
          { date: "2024-01-10", version: "v3", score_before: 0.65, score_after: 0.75 },
          { date: "2024-01-05", version: "v2", score_before: 0.58, score_after: 0.65 },
          { date: "2024-01-01", version: "v1", score_before: 0, score_after: 0.58 },
        ],
        next_best_action: {
          action: "Take a System Design Mock Interview",
          rationale: "Technical score (65%) is the lowest area with sufficient evidence. System design practice will improve both technical and product scores.",
          direct_path: "/mock-interview/new?category=system_design",
        },
        progress_over_time: [
          { date: "2024-01-01", overall: 0.58, methodology: "v1.0.0" },
          { date: "2024-01-05", overall: 0.62, methodology: "v1.0.0" },
          { date: "2024-01-08", overall: 0.65, methodology: "v1.0.0" },
          { date: "2024-01-10", overall: 0.68, methodology: "v1.0.0" },
          { date: "2024-01-12", overall: 0.68, methodology: "v1.0.0" },
        ],
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const overallScore = Math.round((readiness?.overall_score || 0) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container-main h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">InterviewMate</Link>
          <nav className="flex items-center gap-4">
            <Link href="/optimizer" className="btn-secondary text-sm">Resume Optimizer</Link>
            <Link href="/mock-interview/new" className="btn-primary text-sm">Mock Interview</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="container-main">
          <div className="stack-lg mb-8">
            <h1 className="text-headline-lg">Readiness Dashboard</h1>
            <p className="text-body-md text-on-surface-variant">
              Track your interview preparation progress over time
            </p>
          </div>

          {/* Overall Score & Next Action */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="glass-card p-6 stack-lg lg:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-title-md font-medium">Overall Interview Readiness</h2>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Methodology v{readiness?.methodology_version}
                  </p>
                </div>
                <span className="status-chip status-chip-info">Updated today</span>
              </div>

              <div className="relative w-56 h-56 mx-auto my-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="112" cy="112" r="98" fill="none" stroke="#e5eeff" strokeWidth="14" />
                  <circle
                    cx="112"
                    cy="112"
                    r="98"
                    fill="none"
                    stroke="url(#readinessGradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${readiness?.overall_score * 616}`}
                    strokeDashoffset="0"
                  />
                  <defs>
                    <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4648d4" />
                      <stop offset="100%" stopColor="#6063ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-bold text-on-surface">{overallScore}%</span>
                  <span className="text-body-sm text-on-surface-variant">Readiness Score</span>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="h-48 mt-6">
                <canvas id="progressChart" className="w-full h-full"></canvas>
              </div>
            </div>

            {/* Next Best Action */}
            <div className="glass-card p-6 stack-md border-l-4 border-l-primary">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <h3 className="text-title-md font-medium">Next Best Action</h3>
              </div>
              <p className="text-body-md font-medium text-primary">{readiness?.next_best_action?.action}</p>
              <p className="text-body-sm text-on-surface-variant">{readiness?.next_best_action?.rationale}</p>
              <Link
                href={readiness?.next_best_action?.direct_path}
                className="btn-primary mt-4 w-full text-center"
              >
                Take Action
              </Link>
            </div>
          </div>

          <div className="glass-card p-6 stack-lg mb-8">
            <h2 className="text-title-md font-medium mb-4">Component Scores</h2>
            <p className="text-body-sm text-on-surface-variant mb-6">
              Scores are methodology-versioned and only comparable within the same version.
              &ldquo;Insufficient evidence&rdquo; instead of zero scores for new areas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(readiness?.component_scores || {}).map(([component, score]) => {
                const isInsufficient = readiness?.insufficient_evidence?.includes(component);
                return (
                  <div
                    key={component}
                    className={`p-4 rounded-lg stack-sm ${
                      isInsufficient
                        ? "bg-amber-50 border border-amber-200"
                        : "bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="label-sm capitalize">{component.replace("_", " ")}</h4>
                      {isInsufficient && (
                        <span className="status-chip status-chip-warning text-xs">
                          Insufficient Evidence
                        </span>
                      )}
                    </div>
                    <div className="relative w-24 h-24 mx-auto">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" fill="none" stroke="#e5eeff" strokeWidth="6" />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          fill="none"
                          stroke={isInsufficient ? "#fbbf24" : "#4648d4"}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${(score as number) * 251}`}
                          strokeDashoffset="0"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isInsufficient ? (
                          <span className="text-body-sm text-amber-600">—</span>
                        ) : (
                          <span className="text-2xl font-bold text-on-surface">
                            {Math.round((score as number) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History Tabs */}
          <div className="glass-card p-6 stack-lg">
            <h2 className="text-title-md font-medium mb-4">History</h2>

            <div className="space-y-6">
              {/* Mock Interviews */}
              <div>
                <h3 className="label-sm mb-3 flex items-center gap-2">
                  <span className="text-primary">🎭</span> Mock Interviews
                </h3>
                <div className="space-y-2">
                  {readiness?.mock_interviews?.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-4 bg-surface-container rounded-lg">
                      <div className="stack-xs">
                        <p className="font-medium">{m.date}</p>
                        <p className="text-body-sm text-on-surface-variant">Score: {Math.round(m.score * 100)}%</p>
                      </div>
                      <span className="status-chip status-chip-success">{m.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practice Sessions */}
              <div>
                <h3 className="label-sm mb-3 flex items-center gap-2">
                  <span className="text-primary">🎯</span> Practice Sessions
                </h3>
                <div className="space-y-2">
                  {readiness?.practice_history?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-surface-container rounded-lg">
                      <div className="stack-xs">
                        <p className="font-medium">{p.type} • {p.date}</p>
                        <p className="text-body-sm text-on-surface-variant">Score: {Math.round(p.score * 100)}%</p>
                      </div>
                      <span className="status-chip status-chip-success">{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resume Improvements */}
              <div>
                <h3 className="label-sm mb-3 flex items-center gap-2">
                  <span className="text-primary">📈</span> Resume Improvement History
                </h3>
                <div className="space-y-2">
                  {readiness?.resume_improvements?.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-surface-container rounded-lg">
                      <div className="stack-xs">
                        <p className="font-medium">Version {r.version} • {r.date}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          Score: {Math.round(r.score_before * 100)}% → {Math.round(r.score_after * 100)}%
                          <span className="text-green-600 ml-2">(+{Math.round((r.score_after - r.score_before) * 100)}%)</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}