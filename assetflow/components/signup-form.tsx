"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const inputCls =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-signal focus:ring-1 focus:ring-signal/30";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to create account");
        return;
      }

      router.push("/login?created=1");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-ink2">
            Full name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            placeholder="Alex Morgan"
            className={inputCls}
          />
        </div>

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
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className={inputCls}
          />
        </div>

        <p className="text-xs text-ink3 leading-relaxed">
          Your account will be reviewed. Role access is granted by your administrator.
        </p>

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
          {isSubmitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <div className="border-t border-border pt-4 text-center text-sm text-ink3">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-signal transition hover:text-signal2">
          Sign in
        </Link>
      </div>
    </div>
  );
}
