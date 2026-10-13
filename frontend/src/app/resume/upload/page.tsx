"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Status = "idle" | "uploading" | "parsing" | "done" | "error";

export default function ResumeUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
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
    if (!file) return;

    const userId = localStorage.getItem("user_id");
    if (!userId) {
      setError("Please log in first");
      setStatus("error");
      return;
    }

    // Get workspace ID
    let wsId = "";
    try {
      const res = await fetch(`/api/workspaces?user_id=${userId}`);
      const data = await res.json();
      const defaultWs = data.find((w: any) => w.is_default);
      wsId = defaultWs?.id || data[0]?.id || "";
    } catch {}

    if (!wsId) {
      setError("No workspace found");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspace_id", wsId);
      formData.append("user_id", userId);

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setStatus("parsing");

      pollParseStatus(data.id);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const pollParseStatus = async (resumeId: string) => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}`);
      if (!res.ok) throw new Error("Failed to fetch status");

      const data = await res.json();

      if (data.parse_status === "parsed") {
        setStatus("done");
        setParseResult(data);
      } else if (data.parse_status === "failed") {
        setStatus("error");
        setError(data.parse_warnings?.[0] || "Parsing failed");
      } else {
        setTimeout(() => pollParseStatus(resumeId), 2000);
      }
    } catch {
      setStatus("error");
      setError("Failed to check parse status");
    }
  };

  const handleConfirm = async () => {
    if (!parseResult?.id) return;

    try {
      const res = await fetch(`/api/resumes/${parseResult.id}/confirm`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to confirm");

      router.push("/jd/upload");
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
            <Link href="/jd/upload" className="btn-secondary text-sm">Add JD</Link>
            <Link href="/analysis/new" className="btn-primary text-sm">View Analysis</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center stack-lg mb-8">
            <h1 className="text-headline-lg">Upload Resume</h1>
            <p className="text-body-md text-on-surface-variant">
              Upload your resume (PDF or DOCX) to begin the analysis
            </p>
          </div>

          <div className="glass-card p-8 stack-lg">
            {error && (
              <div className="status-chip status-chip-error">{error}</div>
            )}

            {isIdle && (
              <div className="stack-md">
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    file ? "border-green-500 bg-green-50" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => document.getElementById("resume-upload")?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0]) {
                      const f = e.dataTransfer.files[0];
                      if (f.type === "application/pdf" || f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                        setFile(f);
                      } else {
                        setError("Only PDF and DOCX files are supported");
                      }
                    }
                  }}
                >
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.type === "application/pdf" || f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                          setFile(f);
                        } else {
                          setError("Only PDF and DOCX files are supported");
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <div className="text-5xl mb-4">{file ? "✓" : "📄"}</div>
                  <p className="text-body-lg font-medium">
                    {file ? file.name : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    PDF or DOCX, max 10MB
                  </p>
                </div>

                {file && (
                  <div className="flex items-center gap-3 p-4 bg-surface-container rounded-lg">
                    <span className="text-2xl">📄</span>
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-body-sm text-on-surface-variant">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-on-surface-variant hover:text-error"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="btn-primary w-full py-3 mt-4"
                >
                  {isUploading ? "Uploading" : "Upload & Parse"}
                </button>
              </div>
            )}

            {status === "uploading" && (
              <div className="stack-md text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-body-lg">Uploading resume</p>
              </div>
            )}

            {status === "parsing" && (
              <div className="stack-md text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-body-lg">Parsing resume with AI</p>
                <p className="text-body-sm text-on-surface-variant">This may take a moment</p>
              </div>
            )}

            {status === "done" && parseResult && (
              <div className="stack-md">
                <div className="text-center stack-sm">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-3xl text-green-600">
                    ✓
                  </div>
                  <h2 className="text-title-md font-medium">Resume Parsed Successfully</h2>
                  <p className="text-body-md text-on-surface-variant">
                    We extracted structured data from your resume. Review below before confirming.
                  </p>
                </div>

                <div className="stack-md">
                  <div className="p-4 bg-surface-container rounded-lg stack-sm">
                    <h3 className="font-medium">Extracted Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {parseResult.confirmed_data && (
                        <>
                          <div>
                            <p className="text-on-surface-variant">Name</p>
                            <p className="font-medium">{parseResult.confirmed_data.full_name || "Not found"}</p>
                          </div>
                          <div>
                            <p className="text-on-surface-variant">Email</p>
                            <p className="font-medium">{parseResult.confirmed_data.email || "Not found"}</p>
                          </div>
                          <div>
                            <p className="text-on-surface-variant">Skills Found</p>
                            <p className="font-medium">{parseResult.confirmed_data.skills?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-on-surface-variant">Experience Entries</p>
                            <p className="font-medium">{parseResult.confirmed_data.experience?.length || 0}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {parseResult.parse_warnings && parseResult.parse_warnings.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg stack-sm">
                      <h4 className="font-medium text-amber-800">Review Needed</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {parseResult.parse_warnings.map((w: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <span>⚠</span> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button onClick={handleConfirm} className="btn-primary flex-1">Confirm & Continue</button>
                    <button onClick={() => { setFile(null); setStatus("idle"); }} className="btn-secondary flex-1">Re-upload</button>
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
                <button onClick={() => { setStatus("idle"); setFile(null); setError(""); }} className="btn-primary">Try Again</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
