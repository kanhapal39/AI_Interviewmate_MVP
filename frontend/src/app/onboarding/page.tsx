"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "resume" | "jd" | "preferences" | "complete";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("resume");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [resumeId, setResumeId] = useState<string>("");
  const [jdId, setJdId] = useState<string>("");

  // Redirect if not logged in
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/auth/signin");
    }
  }, [router]);

  const steps: { id: Step; label: string }[] = [
    { id: "resume", label: "Resume" },
    { id: "jd", label: "Job Description" },
    { id: "preferences", label: "Preferences" },
    { id: "complete", label: "Complete" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  // Fetch user's workspaces on mount
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      fetch(`/api/workspaces?user_id=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          const defaultWs = data.find((w: Workspace) => w.is_default);
          if (defaultWs) {
            setWorkspaceId(defaultWs.id);
          } else if (data.length > 0) {
            setWorkspaceId(data[0].id);
          }
        })
        .catch(() => {
          // Ignore error, will use fallback
        })
        .finally(() => {
          setWorkspaceLoading(false);
        });
    } else {
      setWorkspaceLoading(false);
    }
  }, []);

  const handleNext = async () => {
    if (workspaceLoading) {
      setError("Loading workspace...");
      return;
    }
    if (!workspaceId) {
      setError("No workspace found. Please refresh and try again.");
      return;
    }
    if (step === "resume" && !resumeFile) {
      setError("Please upload a resume");
      return;
    }
    if (step === "jd" && !jdText.trim()) {
      setError("Please provide a job description");
      return;
    }
    if (step === "preferences" && (!targetRole || !experienceLevel)) {
      setError("Please fill in all preferences");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) throw new Error("User not authenticated");

      if (step === "resume" && resumeFile) {
        const formData = new FormData();
        formData.append("file", resumeFile);
        formData.append("workspace_id", workspaceId);
        formData.append("user_id", userId);

        const res = await fetch("/api/resumes/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to upload resume");
        const data = await res.json();
        setResumeId(data.id);
      }

      if (step === "jd" && jdText.trim()) {
        const formData = new FormData();
        formData.append("jd_text", jdText);
        formData.append("workspace_id", workspaceId);
        formData.append("user_id", userId);

        const res = await fetch("/api/jds/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to save job description");
        const data = await res.json();
        setJdId(data.id);
      }

      if (step === "preferences") {
        // Save preferences
      }

      // Move to next step
      if (currentStepIndex < steps.length - 1) {
        setStep(steps[currentStepIndex + 1].id);
      } else {
// On complete step, create analysis and redirect to results
          if (resumeId && jdId) {
            try {
              const userId = localStorage.getItem("user_id");
              const res = await fetch("/api/analyses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resume_id: resumeId, job_description_id: jdId, user_id: userId }),
              });
            if (res.ok) {
              const data = await res.json();
              router.push(`/analysis/${data.id}`);
              return;
            }
          } catch {}
        }
        // Fallback
        router.push("/analysis/new");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress Bar */}
      <div className="border-b border-border">
        <div className="container-main">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      index < currentStepIndex
                        ? "bg-primary text-on-primary"
                        : index === currentStepIndex
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {index < currentStepIndex ? "✓" : index + 1}
                  </div>
                  <span
                    className={`text-body-sm font-medium ${
                      index <= currentStepIndex
                        ? "text-on-surface"
                        : "text-on-surface-variant"
                    } hidden sm:block`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="stack-lg">
            <div className="text-center stack-sm">
              <h1 className="text-headline-lg">
                {step === "resume" && "Upload Your Resume"}
                {step === "jd" && "Add Job Description"}
                {step === "preferences" && "Set Preferences"}
                {step === "complete" && "You're All Set!"}
              </h1>
              <p className="text-body-md text-on-surface-variant">
                {step === "resume" &&
                  "Upload your resume (PDF or DOCX) to get started"}
                {step === "jd" &&
                  "Paste the job description you're targeting"}
                {step === "preferences" &&
                  "Tell us about your target role and experience level"}
                {step === "complete" &&
                  "We'll analyze your resume against the job description"}
              </p>
            </div>

            {error && (
              <div className="status-chip status-chip-error">{error}</div>
            )}

            <div className="glass-card p-8 stack-lg">
              {step === "resume" && (
                <div className="stack-md">
                  <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                      resumeFile
                        ? "border-green-500 bg-green-50"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => document.getElementById("resume-input")?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files[0]) {
                        setResumeFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <input
                      id="resume-input"
                      type="file"
                      accept=".pdf,.docx"
                      onChange={(e) => e.target.files?.[0] && setResumeFile(e.target.files[0])}
                      className="hidden"
                    />
                    <div className="text-5xl mb-4">{resumeFile ? "✓" : "📄"}</div>
                    <p className="text-body-lg font-medium">
                      {resumeFile ? resumeFile.name : "Click to upload or drag & drop"}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      PDF or DOCX, max 10MB
                    </p>
                  </div>

                  {resumeFile && (
                    <div className="flex items-center gap-3 p-4 bg-surface-container rounded-lg">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1">
                        <p className="font-medium">{resumeFile.name}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setResumeFile(null)}
                        className="text-on-surface-variant hover:text-error"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {step === "jd" && (
                <div className="stack-md">
                  <label className="label-sm">Job Description</label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    className="input-field min-h-[200px] resize-y font-mono text-sm"
                    placeholder="Paste the job description here"
                    rows={10}
                  />
                  <p className="text-body-sm text-on-surface-variant">
                    {jdText.split(/\s+/).length} words
                  </p>
                </div>
              )}

              {step === "preferences" && (
                <div className="stack-md">
                  <div className="stack-xs">
                    <label htmlFor="targetRole" className="label-sm">
                      Target Role
                    </label>
                    <input
                      id="targetRole"
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="input-field"
                      placeholder="e.g., Senior Software Engineer"
                      required
                    />
                  </div>

                  <div className="stack-xs">
                    <label htmlFor="experienceLevel" className="label-sm">
                      Experience Level
                    </label>
                    <select
                      id="experienceLevel"
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">Select your level</option>
                      <option value="entry">Entry (0-2 years)</option>
                      <option value="mid">Mid (3-5 years)</option>
                      <option value="senior">Senior (5-8 years)</option>
                      <option value="lead">Lead/Staff (8+ years)</option>
                    </select>
                  </div>

                  <div className="stack-xs">
                    <label htmlFor="industry" className="label-sm">
                      Industry (Optional)
                    </label>
                    <input
                      id="industry"
                      type="text"
                      className="input-field"
                      placeholder="e.g., FinTech, HealthTech, E-commerce"
                    />
                  </div>
                </div>
              )}

              {step === "complete" && (
                <div className="text-center stack-lg py-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto text-4xl">
                    ✓
                  </div>
                  <h2 className="text-title-md font-medium">
                    {loading ? "Creating Analysis..." : "Ready to analyze!"}
                  </h2>
                  <p className="text-body-md text-on-surface-variant">
                    {loading
                      ? "Analyzing your resume against the job description"
                      : "We'll now analyze your resume against the job description and generate your personalized interview preparation plan."}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="btn-secondary"
              >
                Back
              </button>

              {step !== "complete" ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Processing" : "Continue"}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Creating Analysis..." : "View Analysis"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}