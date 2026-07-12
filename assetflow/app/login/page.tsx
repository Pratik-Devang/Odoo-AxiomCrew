import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/login-form";

type LoginPageProps = {
  searchParams?: {
    next?: string;
    created?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your AssetFlow account">
      <LoginForm
        redirectTo={searchParams?.next ?? "/dashboard"}
        accountCreated={searchParams?.created === "1"}
      />
    </AuthCard>
  );
}
