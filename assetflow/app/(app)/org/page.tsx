"use client";

import { useEffect, useState } from "react";
import { OrganizationSetup } from "@/components/organization-setup";
import { AlertTriangle, Loader2 } from "lucide-react";

type UserRole = "EMPLOYEE" | "DEPARTMENT_HEAD" | "ASSET_MANAGER" | "ADMIN";

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export default function OrgPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load user in org page:", err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center text-sm text-ink3">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-signal" />
        Loading organization setup...
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={32} className="text-danger mb-3" />
        <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Access Denied</h2>
        <p className="text-sm text-ink3 mt-1">You do not have permission to view this page.</p>
      </div>
    );
  }

  return <OrganizationSetup />;
}
