import { redirect } from "next/navigation";

import { ProgressOverview } from "@/features/progress/progress-overview";
import { createClient } from "@/lib/supabase/server";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: verifiedJwt } = await supabase.auth.getClaims();

  if (!verifiedJwt?.claims.sub) {
    redirect("/login");
  }

  const userId = verifiedJwt.claims.sub;
  const [
    profileResult,
    completedModulesResult,
    attemptsResult,
    scenariosResult,
    userAchievementsResult,
    achievementsResult,
  ] = await Promise.all([
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
      .select("completed_at, correct_answers, incorrect_answers, scenario_id, score, xp_earned")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false }),
    supabase.from("scenarios").select("id, title"),
    supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId),
    supabase.from("achievements").select("description, id, name"),
  ]);

  const attempts = attemptsResult.data ?? [];
  const totalCorrect = attempts.reduce((total, attempt) => total + attempt.correct_answers, 0);
  const totalAnswers = attempts.reduce(
    (total, attempt) => total + attempt.correct_answers + attempt.incorrect_answers,
    0,
  );
  const precision = totalAnswers === 0 ? 0 : Math.round((totalCorrect / totalAnswers) * 100);
  const scenarioTitles = new Map(
    (scenariosResult.data ?? []).map((scenario) => [scenario.id, scenario.title]),
  );
  const achievementsById = new Map(
    (achievementsResult.data ?? []).map((achievement) => [achievement.id, achievement]),
  );
  const achievements = (userAchievementsResult.data ?? []).flatMap((userAchievement) => {
    const achievement = achievementsById.get(userAchievement.achievement_id);
    if (!achievement) return [];

    return [{
      description: achievement.description,
      name: achievement.name,
      unlockedAt: userAchievement.unlocked_at,
    }];
  });

  return (
    <ProgressOverview
      achievements={achievements}
      completedModules={completedModulesResult.count ?? 0}
      fullName={profileResult.data?.full_name?.trim() || "Usuario"}
      level={profileResult.data?.level ?? 1}
      precision={precision}
      recentAttempts={attempts.slice(0, 5).map((attempt) => ({
        completedAt: attempt.completed_at ?? new Date().toISOString(),
        score: attempt.score,
        title: scenarioTitles.get(attempt.scenario_id) ?? "Simulación",
        xpEarned: attempt.xp_earned,
      }))}
      simulationsCompleted={attempts.length}
      totalXp={profileResult.data?.xp ?? 0}
    />
  );
}
