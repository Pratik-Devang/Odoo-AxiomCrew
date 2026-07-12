"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

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

  const inputClassName =
    "w-full rounded-lg border border-gray-700 bg-[#111315] px-3.5 py-2.5 text-sm text-gray-100 outline-none transition placeholder:text-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/40";

  return (
    <>
      <p className="mb-6 text-center text-sm text-gray-400">Create your employee account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-gray-300">
            Full name
          </label>
          <input id="name" name="name" autoComplete="name" required minLength={2} placeholder="Alex Morgan" className={inputClassName} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-gray-300">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="name@company.com" className={inputClassName} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-gray-300">
            Password
          </label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" className={inputClassName} />
        </div>

        <p className="text-xs leading-5 text-gray-500">
          New accounts are created as employees. Admin roles are assigned later.
        </p>

        {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg border border-green-500/50 bg-af-green px-4 py-2.5 text-sm font-semibold text-green-100 transition hover:border-green-400 hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-800 pt-5 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-green-400 hover:text-green-300">
          Sign in
        </Link>
      </div>
    </>
  );
}
