"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";

const demoCredentials = [
  {
    role: "Admin",
    name: "Avery Admin",
    email: "admin@assetflow.local",
    password: "Password123!",
  },
  {
    role: "Department Head",
    name: "Priya Shah",
    email: "priya.shah@assetflow.local",
    password: "Password123!",
  },
  {
    role: "Asset Manager",
    name: "Elena Torres",
    email: "elena.torres@assetflow.local",
    password: "Password123!",
  },
  {
    role: "Employee",
    name: "Mia Chen",
    email: "mia.chen@assetflow.local",
    password: "Password123!",
  },
];

export function LoginForm({ redirectTo = "/dashboard", accountCreated = false }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);

  function fillCredentials(account: (typeof demoCredentials)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
    setCredentialsOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
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

      <div className="relative">
        <button
          type="button"
          onClick={() => setCredentialsOpen((open) => !open)}
          className="flex w-full items-center justify-between border-2 border-ink bg-canvas px-3 py-2 text-left text-xs font-bold uppercase tracking-widest text-ink transition hover:bg-sunken"
        >
          Demo login credentials
          <ChevronDown size={14} className={credentialsOpen ? "rotate-180 transition" : "transition"} />
        </button>

        {credentialsOpen && (
          <div className="absolute left-0 right-0 z-20 mt-1 border-2 border-ink bg-surface shadow-md">
            {demoCredentials.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillCredentials(account)}
                className="flex w-full items-center justify-between gap-3 border-b border-ink/10 px-3 py-2 text-left transition last:border-b-0 hover:bg-canvas"
              >
                <span>
                  <span className="block text-xs font-bold text-ink">{account.role}</span>
                  <span className="block text-[11px] text-ink3">{account.name}</span>
                </span>
                <span className="font-mono text-[10px] text-signal">{account.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>

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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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

