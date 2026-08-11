import { redirect } from "next/navigation";

import { DashboardOverview } from "@/features/dashboard/dashboard-overview";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: verifiedJwt } = await supabase.auth.getClaims();

  if (!verifiedJwt?.claims.sub) {
    redirect("/login");
  }

  const userId = verifiedJwt.claims.sub;
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [profileResult, completedModulesResult, weeklySimulationsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, level, xp")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_module_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("simulation_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("completed_at", startOfWeek.toISOString()),
  ]);

  return (
    <DashboardOverview
      completedModules={completedModulesResult.count ?? 0}
      fullName={profileResult.data?.full_name?.trim() || "bienvenido"}
      level={profileResult.data?.level ?? 1}
      simulationsThisWeek={weeklySimulationsResult.count ?? 0}
      totalXp={profileResult.data?.xp ?? 0}
    />
  );
}
