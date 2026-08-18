import type { SimulationCatalogs } from "@/features/simulation-engine/catalogs";
import {
  generateDynamicScenarioSession,
  type DynamicScenarioGenerationOptions,
} from "@/features/simulation-engine/dynamic-session-generator";
import { SimulationIntegrationRuntime } from "@/features/simulation-engine/integration-runtime";
import { parseSimulationCheckpoint } from "@/features/simulation-engine/persistence";
import type {
  ScenarioDefinition,
  SimulationIntegrationSnapshot,
} from "@/features/simulation-engine/integration-contract";

export type SimulationBootstrapSource = "generated" | "resumed";

export type SimulationCheckpointLoader = (
  scenarioDefinitionId: string,
) => Promise<string | null>;

export type SimulationBootstrapInput = {
  definition: ScenarioDefinition;
  seed: string;
  catalogs: SimulationCatalogs;
  generation?: DynamicScenarioGenerationOptions;
  loadLatestCheckpoint?: SimulationCheckpointLoader;
};

export type SimulationBootstrapResult = {
  source: SimulationBootstrapSource;
  runtime: SimulationIntegrationRuntime;
  snapshot: SimulationIntegrationSnapshot;
  sessionId: string;
  seed: string;
  generationAttempts: number | null;
};

export class SimulationBootstrapError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SimulationBootstrapError";
  }
}

function assertCompatibleCheckpoint(
  definition: ScenarioDefinition,
  checkpoint: ReturnType<typeof parseSimulationCheckpoint>,
  generation: DynamicScenarioGenerationOptions | undefined,
) {
  if (
    checkpoint.definition.id !== definition.id ||
    checkpoint.definition.version !== definition.version
  ) {
    throw new SimulationBootstrapError(
      "checkpoint_definition_mismatch",
      "Stored checkpoint does not match the requested scenario definition/version.",
    );
  }

  if (generation?.playerRole && checkpoint.session.playerRole !== generation.playerRole) {
    throw new SimulationBootstrapError(
      "checkpoint_role_mismatch",
      "Stored checkpoint belongs to a different player role.",
    );
  }

  if (generation?.mode && checkpoint.session.mode !== generation.mode) {
    throw new SimulationBootstrapError(
      "checkpoint_mode_mismatch",
      "Stored checkpoint belongs to a different simulation mode.",
    );
  }
}

export async function bootstrapSimulationRuntime(
  input: SimulationBootstrapInput,
): Promise<SimulationBootstrapResult> {
  const serializedCheckpoint = input.loadLatestCheckpoint
    ? await input.loadLatestCheckpoint(input.definition.id)
    : null;

  if (serializedCheckpoint) {
    const checkpoint = parseSimulationCheckpoint(serializedCheckpoint);
    assertCompatibleCheckpoint(input.definition, checkpoint, input.generation);

    const runtime = SimulationIntegrationRuntime.fromCheckpoint(checkpoint);
    const snapshot = runtime.snapshot();

    return {
      source: "resumed",
      runtime,
      snapshot,
      sessionId: checkpoint.session.id,
      seed: checkpoint.session.seed,
      generationAttempts: null,
    };
  }

  const generated = generateDynamicScenarioSession(
    input.definition,
    input.seed,
    input.catalogs,
    input.generation,
  );
  const runtime = new SimulationIntegrationRuntime(input.definition, generated.session);
  const snapshot = runtime.snapshot();

  return {
    source: "generated",
    runtime,
    snapshot,
    sessionId: generated.session.id,
    seed: generated.session.seed,
    generationAttempts: generated.attempts,
  };
}
