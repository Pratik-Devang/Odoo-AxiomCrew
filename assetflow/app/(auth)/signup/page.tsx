import { AuthCard } from "@/components/auth-card";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <AuthCard title="Create account" subtitle="Get started with AssetFlow">
      <SignupForm />
    </AuthCard>
  );
}
