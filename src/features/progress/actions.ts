"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type SaveSimulationAttemptInput = {
  attemptId: string;
  correctAnswers: number;
  incorrectAnswers: number;
  scenarioSlug: string;
  startedAt: string;
};

export type SaveSimulationAttemptResult = {
  message: string;
  status: "duplicate" | "error" | "saved";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveSimulationAttempt(
  input: SaveSimulationAttemptInput,
): Promise<SaveSimulationAttemptResult> {
  if (
    !uuidPattern.test(input.attemptId) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.scenarioSlug) ||
    !Number.isInteger(input.correctAnswers) ||
    !Number.isInteger(input.incorrectAnswers) ||
    input.correctAnswers < 0 ||
    input.incorrectAnswers < 0 ||
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
    p_scenario_slug: input.scenarioSlug,
    p_started_at: input.startedAt,
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

  if (!data) {
    return { message: "Este intento ya estaba guardado.", status: "duplicate" };
  }

  return { message: "Intento guardado y progreso actualizado.", status: "saved" };
}
