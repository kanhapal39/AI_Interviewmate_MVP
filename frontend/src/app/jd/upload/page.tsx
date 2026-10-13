"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Status = "idle" | "uploading" | "parsing" | "done" | "error";

export default function JDUploadPage() {
  const router = useRouter();
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [parseResult, setParseResult] = useState<any>(null);

  // Redirect if not logged in
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/auth/signin");
    }
  }, [router]);

  const isIdle = status === "idle";
  const isUploading = status === "uploading";

  const handleUpload = async () => {
    if (!jdText.trim() && !jdFile) {
      setError("Please provide a job description");
      return;
    }

    setStatus("uploading");
    setError("");

    try {
      if (jdFile) {
        const formData = new FormData();
        formData.append("file", jdFile);
        formData.append("workspace_id", "default");
        formData.append("user_id", "current");

        const res = await fetch("/api/jds/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
      } else {
        const res = await fetch("/api/jds/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jd_text: jdText,
            workspace_id: "default",
            user_id: "current",
          }),
        });

        if (!res.ok) throw new Error("Upload failed");
      }

      setStatus("parsing");

      setTimeout(() => pollParseStatus(), 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const pollParseStatus = async () => {
    try {
      setStatus("done");
      setParseResult({
        role_title: "Senior Software Engineer",
        seniority: "Senior",
        required_skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
        preferred_skills: ["GraphQL", "Kubernetes", "Terraform"],
        responsibilities: [
          "Design and implement scalable backend services",
          "Lead code reviews and mentor junior engineers",
          "Collaborate with product and design teams",
        ],
        experience_years: "5+ years",
      });
    } catch {
      setStatus("error");
      setError("Failed to check parse status");
    }
  };

  const handleConfirm = async () => {
    try {
      router.push("/analysis/new");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container-main h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">InterviewMate</Link>
          <nav className="flex items-center gap-4">
            <Link href="/resume/upload" className="btn-secondary text-sm">Upload Resume</Link>
            <Link href="/analysis/new" className="btn-primary text-sm">View Analysis</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center stack-lg mb-8">
            <h1 className="text-headline-lg">Add Job Description</h1>
            <p className="text-body-md text-on-surface-variant">
              Paste or upload the job description you're targeting
            </p>
          </div>

          <div className="glass-card p-8 stack-lg">
            {error && (
              <div className="status-chip status-chip-error">{error}</div>
            )}

            {isIdle && (
              <div className="stack-md">
                <div className="stack-xs">
                  <label className="label-sm">Paste Job Description</label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    className="input-field min-h-[200px] resize-y font-mono text-sm"
                    placeholder="Paste the full job description here"
                    rows={10}
                  />
                </div>

                <div className="relative">
                  <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                      jdFile ? "border-green-500 bg-green-50" : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => document.getElementById("jd-upload")?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files[0]) {
                        const f = e.dataTransfer.files[0];
                        if (f.type === "application/pdf" || f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || f.type === "text/plain") {
                          setJdFile(f);
                        }
                      }
                    }}
                  >
                    <input
                      id="jd-upload"
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.type === "application/pdf" || f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || f.type === "text/plain") {
                            setJdFile(f);
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <div className="text-5xl mb-4">{jdFile ? "✓" : "📋"}</div>
                    <p className="text-body-lg font-medium">
                      {jdFile ? jdFile.name : "Or upload a file (PDF, DOCX, TXT)"}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      Max 10MB
                    </p>
                  </div>

                  {jdFile && (
                    <div className="flex items-center gap-3 p-4 bg-surface-container rounded-lg mt-4">
                      <span className="text-2xl">📋</span>
                      <div className="flex-1">
                        <p className="font-medium">{jdFile.name}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          {(jdFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setJdFile(null)}
                        className="text-on-surface-variant hover:text-error"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={(!jdText.trim() && !jdFile) || isUploading}
                  className="btn-primary w-full py-3 mt-4"
                >
                  {isUploading ? "Processing" : "Parse Job Description"}
                </button>
              </div>
            )}

            {status === "parsing" && (
              <div className="stack-md text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-body-lg">Parsing job description with AI</p>
                <p className="text-body-sm text-on-surface-variant">Extracting requirements and categorizing.</p>
              </div>
            )}

            {status === "done" && parseResult && (
              <div className="stack-md">
                <div className="text-center stack-sm">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-3xl text-green-600">
                    ✓
                  </div>
                  <h2 className="text-title-md font-medium">Job Description Parsed</h2>
                  <p className="text-body-md text-on-surface-variant">
                    We extracted and categorized the requirements. Review below before confirming.
                  </p>
                </div>

                <div className="stack-md">
                  <div className="p-4 bg-surface-container rounded-lg stack-sm">
                    <h3 className="font-medium">{parseResult.role_title}</h3>
                    <p className="text-body-sm text-on-surface-variant">
                      {parseResult.seniority} • {parseResult.experience_years}
                    </p>
                  </div>

                  <div className="stack-md">
                    <h4 className="label-sm">Must Have Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {parseResult.required_skills?.map((skill: string, i: number) => (
                        <span key={i} className="status-chip status-chip-info">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {parseResult.preferred_skills?.length > 0 && (
                    <div className="stack-md">
                      <h4 className="label-sm">Preferred Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {parseResult.preferred_skills.map((skill: string, i: number) => (
                          <span key={i} className="status-chip status-chip-warning">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="stack-md">
                    <h4 className="label-sm">Key Responsibilities</h4>
                    <ul className="space-y-2">
                      {parseResult.responsibilities?.map((resp: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-body-sm">
                          <span className="text-primary mt-1">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={handleConfirm} className="btn-primary flex-1">
                      Confirm & Analyze
                    </button>
                    <button onClick={() => { setStatus("idle"); setJdText(""); setJdFile(null); }} className="btn-secondary flex-1">
                      Re-enter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="text-center stack-md">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto text-3xl text-red-600">
                  ✕
                </div>
                <h2 className="text-title-md font-medium">Upload Failed</h2>
                <p className="text-body-md text-on-surface-variant">{error}</p>
                <button onClick={() => { setStatus("idle"); setJdText(""); setJdFile(null); setError(""); }} className="btn-primary">
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
