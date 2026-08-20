import { redirect } from "next/navigation";

import { countCompletedTrainingLevels, resolveTrainingLevels } from "@/data/training";
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

  const [
    profileResult,
    completedLevelsResult,
    weeklySimulationsResult,
    latestAttemptResult,
    scenariosResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, level, role, xp")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("simulation_attempts")
      .select("level_number")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .not("level_number", "is", null),
    supabase
      .from("simulation_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("completed_at", startOfWeek.toISOString()),
    supabase
      .from("simulation_attempts")
      .select("completed_at, scenario_id, score, xp_earned")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("scenarios").select("id, title"),
  ]);

  if (profileResult.data?.role === "supervisor" || profileResult.data?.role === "admin") {
    redirect("/supervision");
  }

  const completedLevelNumbers = (completedLevelsResult.data ?? []).flatMap((attempt) =>
    typeof attempt.level_number === "number" ? [attempt.level_number] : [],
  );
  const resolvedLevels = resolveTrainingLevels(completedLevelNumbers);
  const availableLevel = resolvedLevels.find((trainingLevel) => trainingLevel.status === "available");
  const recommendedLevel = availableLevel ?? resolvedLevels.toReversed().find(
    (trainingLevel) => trainingLevel.status === "completed",
  ) ?? resolvedLevels[0];
  const latestAttempt = latestAttemptResult.data;
  const scenarioTitle = new Map(
    (scenariosResult.data ?? []).map((scenario) => [scenario.id, scenario.title]),
  );

  return (
    <DashboardOverview
      completedModules={countCompletedTrainingLevels(completedLevelNumbers)}
      fullName={profileResult.data?.full_name?.trim() || "bienvenido"}
      latestAttempt={latestAttempt ? {
        completedAt: latestAttempt.completed_at ?? new Date().toISOString(),
        score: latestAttempt.score,
        title: scenarioTitle.get(latestAttempt.scenario_id) ?? "Simulación",
        xpEarned: latestAttempt.xp_earned,
      } : null}
      level={profileResult.data?.level ?? 1}
      recommendedLevel={{
        description: recommendedLevel.description,
        href: `/simulaciones/${recommendedLevel.caseSlugs[0]}?nivel=${recommendedLevel.number}`,
        isReview: !availableLevel,
        number: recommendedLevel.number,
        title: recommendedLevel.title,
      }}
      simulationsThisWeek={weeklySimulationsResult.count ?? 0}
      totalXp={profileResult.data?.xp ?? 0}
    />
  );
}
