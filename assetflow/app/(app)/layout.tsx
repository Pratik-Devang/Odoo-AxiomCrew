import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";

// App layout — wraps all authenticated app pages with the sidebar shell.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const serializedUser = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    : null;

  return (
    <AppShell user={serializedUser}>
      {children}
    </AppShell>
  );
}
