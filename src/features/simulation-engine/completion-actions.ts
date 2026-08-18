"use server";

import { saveSimulationAttempt } from "@/features/progress/actions";
import type {
  SimulationExperienceAttemptInput,
  SimulationExperienceAttemptResult,
} from "@/features/simulation-engine/experience-controller";

/**
 * Server-side adapter between the dynamic engine and the existing FarmaVerse
 * progress/XP persistence flow. Keeping this bridge outside the engine lets
 * the core remain independent from Supabase and the legacy progress schema.
 */
export async function saveSimulationExperienceAttempt(
  input: SimulationExperienceAttemptInput,
): Promise<SimulationExperienceAttemptResult> {
  return saveSimulationAttempt({
    attemptId: input.attemptId,
    correctAnswers: input.correctAnswers,
    incorrectAnswers: input.incorrectAnswers,
    criterionResults: input.criterionResults,
    levelNumber: input.levelNumber,
    scenarioSlug: input.scenarioSlug,
    startedAt: input.startedAt,
  });
}
