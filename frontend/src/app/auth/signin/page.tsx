"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Store token (in production: use secure httpOnly cookie)
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.user.id);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          <h1 className="text-headline-lg">Welcome back</h1>
          <p className="text-body-md text-on-surface-variant">
            Sign in to continue your interview preparation
          </p>
        </div>

        <div className="glass-card p-8 stack-lg">
          {error && (
            <div className="status-chip status-chip-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="stack-md">
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
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4"
            >
              {loading ? "Signing in" : "Sign In"}
            </button>
          </form>

          <div className="text-center text-body-md text-on-surface-variant">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}