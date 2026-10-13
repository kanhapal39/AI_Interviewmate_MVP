"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      router.push("/onboarding");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setSuccess("Successfully registered! Redirecting...");
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.user.id);
      
      setTimeout(() => {
        router.push("/onboarding");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center stack-lg mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            InterviewMate
          </Link>
          <h1 className="text-headline-lg">Create your account</h1>
          <p className="text-body-md text-on-surface-variant">
            Start your interview preparation journey
          </p>
        </div>

        <div className="glass-card p-8 stack-lg">
          {error && (
            <div className="status-chip status-chip-error">
              {error}
            </div>
          )}
          {success && (
            <div className="status-chip status-chip-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="stack-md">
            <div className="stack-xs">
              <label htmlFor="name" className="label-sm">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
                required
                autoComplete="name"
              />
            </div>

            <div className="stack-xs">
              <label htmlFor="email" className="label-sm">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="stack-xs">
              <label htmlFor="password" className="label-sm">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div className="stack-xs">
              <label htmlFor="confirmPassword" className="label-sm">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4"
            >
              {loading ? "Creating account" : "Create Account"}
            </button>
          </form>

          <div className="text-center text-body-md text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>

          <p className="text-body-sm text-on-surface-variant text-center pt-4">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}