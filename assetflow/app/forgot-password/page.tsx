import Link from "next/link";
import { AuthCard } from "@/components/auth-card";

export default function ForgotPasswordPage() {
  return (
    <AuthCard>
      <div className="text-center">
        <h2 className="text-base font-semibold text-white">Check your email</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          If an AssetFlow account exists for that address, password reset instructions will be sent.
        </p>
        <p className="mt-3 text-xs text-gray-500">Email sending is disabled in this demo.</p>
        <Link
          href="/login"
          className="mt-6 block w-full rounded-lg border border-green-500/50 bg-af-green px-4 py-2.5 text-sm font-semibold text-green-100 transition hover:border-green-400 hover:text-green-400"
        >
          Back to Sign In
        </Link>
      </div>
    </AuthCard>
  );
}
