"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    name: "John Doe",
    email: "john@example.com",
    audio_retention_days: 30,
    transcript_retention_days: 90,
  });

  // Redirect if not logged in
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/auth/signin");
    }
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production: call API
    alert("Settings saved!");
  };

  const handleExport = async () => {
    // In production: call export API
    alert("Exporting data");
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // In production: call delete API
      alert("Account deletion requested");
    }
  };

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

      <main className="flex-1 px-6 py-8">
        <div className="container-main max-w-3xl">
          <div className="stack-lg mb-8">
            <h1 className="text-headline-lg">Profile & Settings</h1>
            <p className="text-body-md text-on-surface-variant">
              Manage your account, privacy preferences, and data
            </p>
          </div>

          {/* Profile Section */}
          <div className="glass-card p-6 stack-lg mb-8">
            <h2 className="text-title-md font-medium mb-4">Profile Information</h2>
            <form onSubmit={handleSave} className="stack-md">
              <div className="stack-xs">
                <label htmlFor="name" className="label-sm">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="stack-xs">
                <label htmlFor="email" className="label-sm">Email</label>
                <input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="input-field"
                  disabled
                />
                <p className="text-body-sm text-on-surface-variant">Email cannot be changed</p>
              </div>
              <button type="submit" className="btn-primary">Save Changes</button>
            </form>
          </div>

          {/* Privacy & Retention */}
          <div className="glass-card p-6 stack-lg mb-8">
            <h2 className="text-title-md font-medium mb-4 flex items-center gap-2">
              <span>🔒</span> Privacy & Data Retention
            </h2>
            <p className="text-body-sm text-on-surface-variant mb-6">
              Control how long your interview data is retained. Shorter retention periods
              improve privacy but limit historical progress tracking.
            </p>

            <form onSubmit={handleSave} className="stack-lg">
              <div className="stack-xs">
                <label htmlFor="audio_retention" className="label-sm">
                  Audio Recording Retention
                </label>
                <select
                  id="audio_retention"
                  value={settings.audio_retention_days}
                  onChange={(e) => setSettings({ ...settings, audio_retention_days: parseInt(e.target.value) })}
                  className="input-field"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days (default)</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
                <p className="text-body-sm text-on-surface-variant">
                  Audio files are automatically deleted after this period. Transcripts may be retained longer.
                </p>
              </div>

              <div className="stack-xs">
                <label htmlFor="transcript_retention" className="label-sm">
                  Transcript & Evaluation Retention
                </label>
                <select
                  id="transcript_retention"
                  value={settings.transcript_retention_days}
                  onChange={(e) => setSettings({ ...settings, transcript_retention_days: parseInt(e.target.value) })}
                  className="input-field"
                >
                  <option value={30}>30 days</option>
                  <option value={90}>90 days (default)</option>
                  <option value={180}>180 days</option>
                  <option value={365}>1 year</option>
                </select>
                <p className="text-body-sm text-on-surface-variant">
                  Interview transcripts, evaluations, and feedback are retained for this period.
                </p>
              </div>

              <button type="submit" className="btn-primary">Save Retention Settings</button>
            </form>
          </div>

          {/* Data Export */}
          <div className="glass-card p-6 stack-lg mb-8">
            <h2 className="text-title-md font-medium mb-4 flex items-center gap-2">
              <span>📤</span> Data Export
            </h2>
            <p className="text-body-sm text-on-surface-variant mb-6">
              Download all your data in machine-readable format (JSON). Includes resume versions,
              interview history, evaluations, and progress data.
            </p>
            <button onClick={handleExport} className="btn-secondary">
              Export All Data (JSON)
            </button>
          </div>

          {/* Account Deletion */}
          <div className="glass-card p-6 stack-lg border border-red-200 bg-red-50">
            <h2 className="text-title-md font-medium mb-4 flex items-center gap-2 text-red-600">
              <span>⚠</span> Delete Account
            </h2>
            <p className="text-body-sm text-red-700 mb-6">
              Permanently delete your account and all associated data. This action is irreversible.
              Your resume versions, interview history, evaluations, and progress will be permanently removed.
              An audit trail will be preserved for compliance purposes.
            </p>
            <button onClick={handleDelete} className="btn-secondary border-red-300 text-red-600 hover:bg-red-100">
              Delete My Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}