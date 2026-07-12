import { redirect } from "next/navigation";
import { OrganizationSetup } from "@/components/organization-setup";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrganizationSetupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/organization-setup");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return <OrganizationSetup />;
}
