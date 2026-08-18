"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { SimulationCheckpointDatabase } from "@/features/simulation-engine/checkpoint-database";
import {
  parseSimulationCheckpoint,
  serializeSimulationCheckpoint,
  SimulationCheckpointError,
} from "@/features/simulation-engine/persistence";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const MAX_CHECKPOINT_CHARACTERS = 1_000_000;
const identifierPattern = /^[A-Za-z0-9._:-]{1,200}$/;

type SaveCheckpointResult = {
  status: "error" | "saved";
  message: string;
  sessionId?: string;
  savedAt?: string;
};

type LoadCheckpointResult = {
  status: "error" | "missing" | "loaded";
  message: string;
  serializedCheckpoint?: string;
  sessionId?: string;
  savedAt?: string;
};

type DeleteCheckpointResult = {
  status: "deleted" | "error";
  message: string;
};

function checkpointClient(
  client: Awaited<ReturnType<typeof createClient>>,
): SupabaseClient<SimulationCheckpointDatabase> {
  return client as unknown as SupabaseClient<SimulationCheckpointDatabase>;
}

async function authenticatedCheckpointClient() {
  const baseClient = await createClient();
  const { data: verifiedJwt } = await baseClient.auth.getClaims();
  const userId = verifiedJwt?.claims.sub;

  if (!userId) return null;

  return {
    client: checkpointClient(baseClient),
    userId,
  };
}

function validIdentifier(value: string) {
  return identifierPattern.test(value);
}

function checkpointToJson(serialized: string): Json {
  return JSON.parse(serialized) as Json;
}

export async function saveSimulationCheckpointToCloud(
  serializedCheckpoint: string,
): Promise<SaveCheckpointResult> {
  if (
    typeof serializedCheckpoint !== "string" ||
    serializedCheckpoint.length === 0 ||
    serializedCheckpoint.length > MAX_CHECKPOINT_CHARACTERS
  ) {
    return {
      status: "error",
      message: "El checkpoint recibido no es válido.",
    };
  }

  let checkpoint;
  try {
    checkpoint = parseSimulationCheckpoint(serializedCheckpoint);
  } catch (error) {
    if (error instanceof SimulationCheckpointError) {
      console.error("Rejected simulation checkpoint", error.code);
    }
    return {
      status: "error",
      message: "El checkpoint recibido no superó la validación.",
    };
  }

  if (
    !validIdentifier(checkpoint.session.id) ||
    !validIdentifier(checkpoint.definition.id)
  ) {
    return {
      status: "error",
      message: "Los identificadores del checkpoint no son válidos.",
    };
  }

  const auth = await authenticatedCheckpointClient();
  if (!auth) {
    return {
      status: "error",
      message: "Tu sesión expiró. Inicia sesión nuevamente.",
    };
  }

  const canonicalSerialized = serializeSimulationCheckpoint(checkpoint);
  const { error } = await auth.client
    .from("simulation_checkpoints")
    .upsert(
      {
        user_id: auth.userId,
        session_id: checkpoint.session.id,
        scenario_definition_id: checkpoint.definition.id,
        scenario_definition_version: checkpoint.definition.version,
        checkpoint_version: checkpoint.checkpointVersion,
        checkpoint: checkpointToJson(canonicalSerialized),
        saved_at: checkpoint.savedAt,
      },
      { onConflict: "user_id,session_id" },
    );

  if (error) {
    console.error("Unable to save simulation checkpoint", error.code);
    return {
      status: "error",
      message: "No pudimos guardar el progreso de la simulación.",
    };
  }

  return {
    status: "saved",
    message: "Progreso de la simulación guardado.",
    sessionId: checkpoint.session.id,
    savedAt: checkpoint.savedAt,
  };
}

export async function loadSimulationCheckpointFromCloud(
  sessionId: string,
): Promise<LoadCheckpointResult> {
  if (!validIdentifier(sessionId)) {
    return { status: "error", message: "El identificador de sesión no es válido." };
  }

  const auth = await authenticatedCheckpointClient();
  if (!auth) {
    return {
      status: "error",
      message: "Tu sesión expiró. Inicia sesión nuevamente.",
    };
  }

  const { data, error } = await auth.client
    .from("simulation_checkpoints")
    .select("checkpoint,saved_at,session_id")
    .eq("user_id", auth.userId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load simulation checkpoint", error.code);
    return { status: "error", message: "No pudimos recuperar la simulación guardada." };
  }

  if (!data) {
    return { status: "missing", message: "No existe una sesión guardada con ese identificador." };
  }

  try {
    const checkpoint = parseSimulationCheckpoint(JSON.stringify(data.checkpoint));
    return {
      status: "loaded",
      message: "Simulación guardada recuperada.",
      serializedCheckpoint: serializeSimulationCheckpoint(checkpoint),
      sessionId: data.session_id,
      savedAt: data.saved_at,
    };
  } catch (error) {
    if (error instanceof SimulationCheckpointError) {
      console.error("Stored checkpoint failed validation", error.code);
    }
    return {
      status: "error",
      message: "La sesión guardada está dañada o usa una versión no compatible.",
    };
  }
}

export async function loadLatestSimulationCheckpointFromCloud(
  scenarioDefinitionId: string,
): Promise<LoadCheckpointResult> {
  if (!validIdentifier(scenarioDefinitionId)) {
    return { status: "error", message: "El identificador de escenario no es válido." };
  }

  const auth = await authenticatedCheckpointClient();
  if (!auth) {
    return {
      status: "error",
      message: "Tu sesión expiró. Inicia sesión nuevamente.",
    };
  }

  const { data, error } = await auth.client
    .from("simulation_checkpoints")
    .select("checkpoint,saved_at,session_id")
    .eq("user_id", auth.userId)
    .eq("scenario_definition_id", scenarioDefinitionId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Unable to load latest simulation checkpoint", error.code);
    return { status: "error", message: "No pudimos recuperar la simulación guardada." };
  }

  if (!data) {
    return { status: "missing", message: "No hay una sesión pendiente para este escenario." };
  }

  try {
    const checkpoint = parseSimulationCheckpoint(JSON.stringify(data.checkpoint));
    return {
      status: "loaded",
      message: "Última sesión guardada recuperada.",
      serializedCheckpoint: serializeSimulationCheckpoint(checkpoint),
      sessionId: data.session_id,
      savedAt: data.saved_at,
    };
  } catch (error) {
    if (error instanceof SimulationCheckpointError) {
      console.error("Stored checkpoint failed validation", error.code);
    }
    return {
      status: "error",
      message: "La sesión guardada está dañada o usa una versión no compatible.",
    };
  }
}

export async function deleteSimulationCheckpointFromCloud(
  sessionId: string,
): Promise<DeleteCheckpointResult> {
  if (!validIdentifier(sessionId)) {
    return { status: "error", message: "El identificador de sesión no es válido." };
  }

  const auth = await authenticatedCheckpointClient();
  if (!auth) {
    return {
      status: "error",
      message: "Tu sesión expiró. Inicia sesión nuevamente.",
    };
  }

  const { error } = await auth.client
    .from("simulation_checkpoints")
    .delete()
    .eq("user_id", auth.userId)
    .eq("session_id", sessionId);

  if (error) {
    console.error("Unable to delete simulation checkpoint", error.code);
    return { status: "error", message: "No pudimos eliminar la sesión guardada." };
  }

  return { status: "deleted", message: "Sesión guardada eliminada." };
}
