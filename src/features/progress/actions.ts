"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { AttemptCriterionResult } from "@/types/training-simulation";

type SaveSimulationAttemptInput = {
  attemptId: string;
  correctAnswers: number;
  criterionResults?: AttemptCriterionResult[];
  incorrectAnswers: number;
  levelNumber?: number;
  scenarioSlug: string;
  startedAt: string;
};

export type SaveSimulationAttemptResult = {
  message: string;
  status: "duplicate" | "error" | "saved";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const criterionIdPattern = /^criterion-[1-7]-[a-z0-9-]+$/;

export async function saveSimulationAttempt(
  input: SaveSimulationAttemptInput,
): Promise<SaveSimulationAttemptResult> {
  if (
    !uuidPattern.test(input.attemptId) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.scenarioSlug) ||
    !Number.isInteger(input.correctAnswers) ||
    !Number.isInteger(input.incorrectAnswers) ||
    (input.criterionResults !== undefined && !Array.isArray(input.criterionResults)) ||
    (input.criterionResults ?? []).some(
      (result) =>
        !criterionIdPattern.test(result.criterionId) ||
        !["met", "reinforcement", "intercepted"].includes(result.status),
    ) ||
    (input.levelNumber !== undefined && !Number.isInteger(input.levelNumber)) ||
    input.correctAnswers < 0 ||
    input.incorrectAnswers < 0 ||
    (input.levelNumber !== undefined &&
      (input.levelNumber < 1 || input.levelNumber > 6)) ||
    Number.isNaN(Date.parse(input.startedAt))
  ) {
    return { message: "El resultado recibido no es válido.", status: "error" };
  }

  const supabase = await createClient();
  const { data: verifiedJwt } = await supabase.auth.getClaims();

  if (!verifiedJwt?.claims.sub) {
    return { message: "Tu sesión expiró. Inicia sesión nuevamente.", status: "error" };
  }

  const { data, error } = await supabase.rpc("complete_simulation_attempt", {
    p_attempt_id: input.attemptId,
    p_correct_answers: input.correctAnswers,
    p_incorrect_answers: input.incorrectAnswers,
    p_criterion_results: input.criterionResults ?? [],
    p_scenario_slug: input.scenarioSlug,
    p_started_at: input.startedAt,
    ...(input.levelNumber !== undefined ? { p_level_number: input.levelNumber } : {}),
  });

  if (error) {
    console.error("Unable to save simulation attempt", error.code);
    return {
      message: "No pudimos guardar el intento. Puedes volver a intentarlo.",
      status: "error",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/progreso");
  revalidatePath("/simulaciones");

  if (!data) {
    return { message: "Este intento ya estaba guardado.", status: "duplicate" };
  }

  return { message: "Intento guardado y progreso actualizado.", status: "saved" };
}
