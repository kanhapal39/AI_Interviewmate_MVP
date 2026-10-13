"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Gap {
  id: string;
  gap: string;
  why_it_matters: string;
  evidence_from_jd: string;
  suggested_action: string;
  severity: "critical" | "important" | "minor";
}

interface Analysis {
  id: string;
  score: number;
  gaps: Gap[];
}

export default function GapAnalysisPage() {
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
          {
            id: "gap-3",
            gap: "System Design at scale",
            why_it_matters: "Critical for senior engineering roles handling high-traffic systems",
            evidence_from_jd: "Design scalable systems handling 1M+ requests/day",
            suggested_action: "Add system design projects or describe architecture decisions in experience",
            severity: "important",
          },
        ],
      });
      setLoading(false);
    }, 500);
  }, [analysisId]);

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
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="container-main">
          <div className="stack-lg mb-8">
            <h1 className="text-headline-lg">Gap Analysis</h1>
            <p className="text-body-md text-on-surface-variant">
              Identified gaps between your resume and the job description
            </p>
          </div>

          <div className="glass-card p-6 stack-md mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-title-md font-medium">Summary</h2>
              <div className="flex items-center gap-4">
                <span className="status-chip status-chip-error">Critical: {analysis?.gaps?.filter(g => g.severity === "critical").length || 0}</span>
                <span className="status-chip status-chip-warning">Important: {analysis?.gaps?.filter(g => g.severity === "important").length || 0}</span>
                <span className="status-chip status-chip-info">Minor: {analysis?.gaps?.filter(g => g.severity === "minor").length || 0}</span>
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Address critical gaps first for the biggest impact on your match score.
            </p>
          </div>

          <div className="space-y-4">
            {analysis?.gaps?.map((gap) => (
              <div key={gap.id} className="glass-card p-6 stack-md border-l-4 border-l-primary">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 stack-sm">
                    <div className="flex items-center gap-3">
                      <h4 className="text-title-md font-medium">{gap.gap}</h4>
                      <span className={`status-chip ${gap.severity === "critical" ? "status-chip-error" : gap.severity === "important" ? "status-chip-warning" : "status-chip-info"}`}>
                        {gap.severity}
                      </span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant">{gap.why_it_matters}</p>
                    <div className="p-3 bg-surface-container rounded-md stack-xs">
                      <p className="font-medium text-on-surface-variant">JD Evidence:</p>
                      <p className="text-body-sm">{gap.evidence_from_jd}</p>
                    </div>
                    <p className="text-body-sm"><strong>Suggested Action:</strong> {gap.suggested_action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <Link href={`/analysis/${analysisId}/optimizer`} className="btn-primary">Open Resume Optimizer</Link>
            <Link href={`/mock-interview/new?analysis=${analysisId}`} className="btn-secondary">Start Mock Interview</Link>
          </div>
        </div>
      </main>
    </div>
  );
}