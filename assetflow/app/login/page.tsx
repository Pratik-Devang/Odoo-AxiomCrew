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
    <AuthCard>
      <LoginForm
        redirectTo={searchParams?.next ?? "/"}
        accountCreated={searchParams?.created === "1"}
      />
    </AuthCard>
  );
}
