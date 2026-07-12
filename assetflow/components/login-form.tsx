"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";

const demoCredentials = [
  { role: "Admin", name: "Avery Admin", email: "admin@assetflow.local", password: "Password123!" },
  { role: "Department Head", name: "Priya Shah", email: "priya.shah@assetflow.local", password: "Password123!" },
  { role: "Department Head", name: "Marcus Reed", email: "marcus.reed@assetflow.local", password: "Password123!" },
  { role: "Asset Manager", name: "Elena Torres", email: "elena.torres@assetflow.local", password: "Password123!" },
  { role: "Asset Manager", name: "Noah Williams", email: "noah.williams@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Mia Chen", email: "mia.chen@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Liam Patel", email: "liam.patel@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Sofia Martinez", email: "sofia.martinez@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Ethan Brown", email: "ethan.brown@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Isabella Davis", email: "isabella.davis@assetflow.local", password: "Password123!" },
  { role: "Department Head", name: "Nora Evans", email: "nora.evans@assetflow.local", password: "Password123!" },
  { role: "Department Head", name: "Owen Brooks", email: "owen.brooks@assetflow.local", password: "Password123!" },
  { role: "Department Head", name: "Grace Kim", email: "grace.kim@assetflow.local", password: "Password123!" },
  { role: "Asset Manager", name: "Victor Stone", email: "victor.stone@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Hannah Lee", email: "hannah.lee@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Arjun Mehta", email: "arjun.mehta@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Chloe Park", email: "chloe.park@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Diego Ramirez", email: "diego.ramirez@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Farah Khan", email: "farah.khan@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Ben Carter", email: "ben.carter@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Leah Thompson", email: "leah.thompson@assetflow.local", password: "Password123!" },
  { role: "Employee", name: "Ravi Nair", email: "ravi.nair@assetflow.local", password: "Password123!" },
];

export function LoginForm({ redirectTo = "/dashboard", accountCreated = false }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function fillCredentials(account: (typeof demoCredentials)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to sign in");
        return;
      }

      const safeDestination = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard";
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
        <div className="flex items-center gap-2 rounded-md border border-go bg-go_bg px-3 py-2 text-sm font-medium text-go">
          <CheckCircle2 size={14} strokeWidth={1.5} />
          Account created. You can sign in now.
        </div>
      )}

      <div>
        <label htmlFor="demo-account" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink3">
          Demo account
        </label>
        <select
          id="demo-account"
          className="af-input h-11 bg-card"
          defaultValue=""
          onChange={(event) => {
            const account = demoCredentials.find((item) => item.email === event.target.value);
            if (account) fillCredentials(account);
          }}
        >
          <option value="">Choose demo credentials</option>
          {demoCredentials.map((account) => (
            <option key={account.email} value={account.email}>
              {account.role} - {account.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink3">
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
            className="af-input h-11 bg-card"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink3">
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
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="af-input h-11 bg-card"
          />
        </div>

        {error && (
          <div role="alert" className="af-auth-toast">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Invalid email or password</p>
              <p className="mt-0.5">Check your credentials and try again.</p>
            </div>
            <button type="button" onClick={() => setError("")} className="text-xs font-semibold text-danger hover:text-[#A93226]">
              Dismiss
            </button>
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="af-btn-primary h-11 w-full rounded-md">
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-xs text-ink3">Trusted by teams managing 2,400+ assets across 18 departments</p>

      <div className="border-t border-border pt-4 text-center text-sm text-ink3">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-signal transition hover:text-signal2">
          Create one
        </Link>
      </div>
    </div>
  );
}
