"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const inputCls =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-signal focus:ring-1 focus:ring-signal/30";

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
        <div className="rounded-md border border-go/30 bg-go_bg px-3 py-2 text-sm text-go">
          Account created. You can sign in now.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink2">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@company.com"
            className={inputCls}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-ink2">
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
            className={inputCls}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger_bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition hover:bg-signal2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="border-t border-border pt-4 text-center text-sm text-ink3">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-signal transition hover:text-signal2">
          Create one
        </Link>
      </div>
    </div>
  );
}
