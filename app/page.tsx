import { redirect } from "next/navigation";
import { FinanceDashboard } from "@/components/dashboard/finance-dashboard";
import { getCurrentUserId } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login");
  }

  return <FinanceDashboard />;
}
