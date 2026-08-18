import { validateScenarioSession } from "@/features/simulation-engine/scenario-validator";
import type {
  ScenarioDefinition,
  SimulationEvent,
  SimulationSession,
} from "@/features/simulation-engine/types";

export const SIMULATION_CHECKPOINT_VERSION = 1 as const;

export type SimulationCheckpoint = {
  checkpointVersion: typeof SIMULATION_CHECKPOINT_VERSION;
  savedAt: string;
  definition: ScenarioDefinition;
  session: SimulationSession;
  events: SimulationEvent[];
};

export class SimulationCheckpointError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SimulationCheckpointError";
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateEvents(sessionId: string, events: readonly SimulationEvent[]) {
  for (const [index, event] of events.entries()) {
    if (!isRecord(event)) {
      throw new SimulationCheckpointError(
        "invalid_event",
        `Checkpoint event ${index + 1} is not an object.`,
      );
    }
    if (event.sessionId !== sessionId) {
      throw new SimulationCheckpointError(
        "event_session_mismatch",
        `Event ${event.id ?? index + 1} belongs to ${String(event.sessionId)}, expected ${sessionId}.`,
      );
    }
    if (event.sequence !== index + 1) {
      throw new SimulationCheckpointError(
        "event_sequence_invalid",
        `Event ${event.id ?? index + 1} has sequence ${String(event.sequence)}, expected ${index + 1}.`,
      );
    }
  }
}

export function createSimulationCheckpoint(
  definition: ScenarioDefinition,
  session: SimulationSession,
  events: readonly SimulationEvent[],
  savedAt = new Date().toISOString(),
): SimulationCheckpoint {
  if (
    session.scenarioDefinitionId !== definition.id ||
    session.scenarioDefinitionVersion !== definition.version
  ) {
    throw new SimulationCheckpointError(
      "scenario_definition_mismatch",
      "Session scenario definition reference does not match the supplied ScenarioDefinition.",
    );
  }

  const validation = validateScenarioSession(definition, session);
  if (!validation.valid) {
    throw new SimulationCheckpointError(
      "invalid_session",
      validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join(" | "),
    );
  }

  validateEvents(session.id, events);

  return {
    checkpointVersion: SIMULATION_CHECKPOINT_VERSION,
    savedAt,
    definition: clone(definition),
    session: clone(session),
    events: clone([...events]),
  };
}

export function serializeSimulationCheckpoint(checkpoint: SimulationCheckpoint): string {
  return JSON.stringify(checkpoint);
}

export function parseSimulationCheckpoint(serialized: string): SimulationCheckpoint {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new SimulationCheckpointError(
      "invalid_json",
      "Simulation checkpoint is not valid JSON.",
    );
  }

  if (!isRecord(parsed)) {
    throw new SimulationCheckpointError(
      "invalid_checkpoint",
      "Simulation checkpoint root must be an object.",
    );
  }

  if (parsed.checkpointVersion !== SIMULATION_CHECKPOINT_VERSION) {
    throw new SimulationCheckpointError(
      "unsupported_checkpoint_version",
      `Unsupported checkpoint version ${String(parsed.checkpointVersion)}.`,
    );
  }

  if (typeof parsed.savedAt !== "string") {
    throw new SimulationCheckpointError(
      "invalid_saved_at",
      "Simulation checkpoint savedAt must be a string.",
    );
  }

  if (!isRecord(parsed.definition) || !isRecord(parsed.session) || !Array.isArray(parsed.events)) {
    throw new SimulationCheckpointError(
      "invalid_checkpoint_shape",
      "Simulation checkpoint must contain definition, session and events.",
    );
  }

  const definition = parsed.definition as ScenarioDefinition;
  const session = parsed.session as SimulationSession;
  const events = parsed.events as SimulationEvent[];

  return createSimulationCheckpoint(definition, session, events, parsed.savedAt);
}
