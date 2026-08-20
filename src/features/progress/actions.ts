"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createExtendedClient } from "@/lib/supabase/server-untyped";
import type { SimulationAlertPayload } from "@/features/simulation-engine";
import type { AttemptCriterionResult } from "@/types/training-simulation";

type SaveSimulationAttemptInput = {
  attemptId: string;
  correctAnswers: number;
  criterionResults?: AttemptCriterionResult[];
  incorrectAnswers: number;
  levelNumber?: number;
  scenarioSlug: string;
  simulationAlerts?: SimulationAlertPayload[];
  startedAt: string;
};

export type SaveSimulationAttemptResult = {
  message: string;
  status: "duplicate" | "error" | "saved";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const criterionIdPattern = /^criterion-[1-7]-[a-z0-9-]+$/;
const pilotQaScenarioPattern = /^pilot__(patient-identification|prescription-review|preparation-comparison|final-identification|instructions)__\d+__[a-z0-9-]+$/;

export async function saveSimulationAttempt(
  input: SaveSimulationAttemptInput,
): Promise<SaveSimulationAttemptResult> {
  if (pilotQaScenarioPattern.test(input.scenarioSlug)) {
    return {
      message: "Modo QA interno: este intento no modifica tu progreso.",
      status: "saved",
    };
  }

  if (
    !uuidPattern.test(input.attemptId) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.scenarioSlug) ||
    !Number.isInteger(input.correctAnswers) ||
    !Number.isInteger(input.incorrectAnswers) ||
    (input.criterionResults !== undefined && !Array.isArray(input.criterionResults)) ||
    (input.simulationAlerts !== undefined && !Array.isArray(input.simulationAlerts)) ||
    (input.criterionResults ?? []).some(
      (result) =>
        !criterionIdPattern.test(result.criterionId) ||
        !["met", "reinforcement", "intercepted"].includes(result.status),
    ) ||
    (input.levelNumber !== undefined && !Number.isInteger(input.levelNumber)) ||
    input.correctAnswers < 0 ||
    input.incorrectAnswers < 0 ||
    (input.levelNumber !== undefined &&
      (input.levelNumber < 1 || input.levelNumber > 7)) ||
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

  let alertPersistenceFailed = false;
  if ((input.simulationAlerts?.length ?? 0) > 0) {
    const extended = await createExtendedClient();
    const alertResult = await extended.rpc("record_simulation_alerts", {
      p_attempt_id: input.attemptId,
      p_alerts: input.simulationAlerts ?? [],
    });
    if (alertResult.error) {
      alertPersistenceFailed = true;
      console.error("Unable to save simulation alerts", alertResult.error.message);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/progreso");
  revalidatePath("/simulaciones");
  revalidatePath("/supervision");

  if (alertPersistenceFailed) {
    return {
      message: "El progreso quedó guardado, pero la trazabilidad de alertas quedó incompleta. Reintenta el guardado para completar el registro.",
      status: "error",
    };
  }

  if (!data) {
    return { message: "Este intento ya estaba guardado y su trazabilidad está actualizada.", status: "duplicate" };
  }

  return { message: "Intento guardado y progreso actualizado.", status: "saved" };
}
