import { redirect } from "next/navigation";

import { dispensingCriteria } from "@/data/training/dispensing-criteria";
import { contentApproval, educationalSources } from "@/data/training/educational-sources";
import { ProgressOverview } from "@/features/progress/progress-overview";
import { createClient } from "@/lib/supabase/server";
import type {
  AttemptCriterionStatus,
  DispensingCriterionId,
} from "@/types/training-simulation";

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
      .select("completed_at, correct_answers, criterion_results, incorrect_answers, scenario_id, score, xp_earned")
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
  const criteriaIndicators = dispensingCriteria.map((criterion) => ({
    criterionId: criterion.id,
    title: criterion.title,
    met: 0,
    intercepted: 0,
    reinforcement: 0,
  }));
  const indicatorByCriterionId = new Map(
    criteriaIndicators.map((indicator) => [indicator.criterionId, indicator]),
  );
  const knownCriterionIds = new Set(dispensingCriteria.map((criterion) => criterion.id));

  for (const attempt of attempts) {
    if (!Array.isArray(attempt.criterion_results)) continue;

    for (const result of attempt.criterion_results) {
      if (!result || typeof result !== "object" || Array.isArray(result)) continue;

      const criterionId = result.criterionId;
      const status = result.status;
      if (typeof criterionId !== "string" || typeof status !== "string") continue;

      if (!knownCriterionIds.has(criterionId as DispensingCriterionId)) continue;
      if (!(["met", "intercepted", "reinforcement"] as const).includes(status as AttemptCriterionStatus)) {
        continue;
      }

      const indicator = indicatorByCriterionId.get(criterionId as DispensingCriterionId);
      if (!indicator) continue;

      indicator[status as AttemptCriterionStatus] += 1;
    }
  }
  const assessedCriteria = criteriaIndicators.reduce(
    (total, indicator) => total + indicator.met + indicator.intercepted + indicator.reinforcement,
    0,
  );
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
      assessedCriteria={assessedCriteria}
      completedModules={completedModulesResult.count ?? 0}
      criteriaIndicators={criteriaIndicators}
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
      sourcesApprovedForTraining={educationalSources.filter(
        (source) => source.reviewStatus === "approved-for-training",
      ).length}
      totalXp={profileResult.data?.xp ?? 0}
      validationRecord={contentApproval}
    />
  );
}
