import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/auth";

// App layout — wraps all authenticated app pages with the sidebar shell.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  return (
    <AppShell role={session?.role ?? null}>
      {children}
    </AppShell>
  );
}
