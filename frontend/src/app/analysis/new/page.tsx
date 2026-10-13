"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewAnalysisPage() {
  const router = useRouter();
  const [resumeId, setResumeId] = useState("");
  const [jdId, setJdId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/auth/signin");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!resumeId || !jdId) {
      setError("Please select both a resume and a job description");
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem("user_id");
      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: resumeId, job_description_id: jdId, user_id: userId }),
      });

      if (!res.ok) throw new Error("Failed to create analysis");

      const data = await res.json();
      router.push(`/analysis/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container-main h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">InterviewMate</Link>
          <nav className="flex items-center gap-4">
            <Link href="/resume/upload" className="btn-secondary text-sm">Upload Resume</Link>
            <Link href="/jd/upload" className="btn-secondary text-sm">Add JD</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center stack-lg mb-8">
            <h1 className="text-headline-lg">Create New Analysis</h1>
            <p className="text-body-md text-on-surface-variant">
              Select a resume and job description to analyze
            </p>
          </div>

          <div className="glass-card p-8 stack-lg">
            {error && (
              <div className="status-chip status-chip-error">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="stack-md">
              <div className="stack-xs">
                <label htmlFor="resume" className="label-sm">Resume</label>
                <select
                  id="resume"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select a resume</option>
                  <option value="resume-1">John Doe - Senior Software Engineer (PDF)</option>
                  <option value="resume-2">John Doe - Full Stack Developer (DOCX)</option>
                </select>
              </div>

              <div className="stack-xs">
                <label htmlFor="jd" className="label-sm">Job Description</label>
                <select
                  id="jd"
                  value={jdId}
                  onChange={(e) => setJdId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select a job description</option>
                  <option value="jd-1">Senior Software Engineer at TechCorp</option>
                  <option value="jd-2">Lead Engineer at StartupXYZ</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 mt-4"
              >
                {loading ? "Creating Analysis" : "Create Analysis"}
              </button>
            </form>

            <div className="text-center text-body-md text-on-surface-variant pt-4">
              <Link href="/resume/upload" className="text-primary font-medium hover:underline">
                Need to upload a resume first?
              </Link>
              {" | "}
              <Link href="/jd/upload" className="text-primary font-medium hover:underline">
                Need to add a job description?
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}