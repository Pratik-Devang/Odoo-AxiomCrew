"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function LoginForm({ redirectTo = "/dashboard", accountCreated = false }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to sign in");
        return;
      }

      const safeDestination =
        redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard";
      router.push(safeDestination);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {accountCreated && (
        <div className="flex items-center gap-2 border-2 border-go bg-go_bg px-3 py-2 text-sm font-medium text-go">
          <CheckCircle2 size={14} />
          Account created. You can sign in now.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-ink2">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@company.com"
            className="af-input"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-ink2">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-ink3 transition hover:text-signal">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="af-input"
          />
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 border-2 border-danger bg-danger_bg px-3 py-2 text-sm text-danger">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="af-btn-primary w-full"
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="border-t-2 border-ink/10 pt-4 text-center text-sm text-ink3">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold text-signal transition hover:text-signal2">
          Create one
        </Link>
      </div>
    </div>
  );
}
