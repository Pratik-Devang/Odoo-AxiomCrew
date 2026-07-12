"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm({ redirectTo = "/", accountCreated = false }) {
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

      const safeDestination = redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/";
      router.push(safeDestination);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <p className="mb-6 text-center text-sm text-gray-400">Sign in to manage your assets</p>

      {accountCreated ? (
        <p className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-400">
          Account created. You can sign in now.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-gray-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@company.com"
            className="w-full rounded-lg border border-gray-700 bg-[#111315] px-3.5 py-2.5 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/40"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-gray-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-700 bg-[#111315] px-3.5 py-2.5 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/40"
          />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-xs text-gray-400 transition hover:text-green-400">
              Forgot password?
            </Link>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg border border-green-500/50 bg-af-green px-4 py-2.5 text-sm font-semibold text-green-100 transition hover:border-green-400 hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="my-6 h-px bg-gray-800" />

      <div className="text-center">
        <p className="text-sm font-medium text-gray-200">New here?</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Sign up creates an employee account, admin roles assigned later
        </p>
        <Link
          href="/signup"
          className="mt-4 block w-full rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:border-green-500/60 hover:bg-af-green hover:text-green-400"
        >
          Create Account
        </Link>
      </div>
    </>
  );
}
