import {
  bootstrapSimulationRuntime,
  type SimulationBootstrapSource,
} from "@/features/simulation-engine/bootstrap";
import type { SimulationCatalogs } from "@/features/simulation-engine/catalogs";
import {
  buildSimulationAttemptCompletion,
  type SimulationAttemptCompletion,
} from "@/features/simulation-engine/completion";
import type { DynamicScenarioGenerationOptions } from "@/features/simulation-engine/dynamic-session-generator";
import type {
  SimulationIntegrationDispatchReceipt,
  SimulationIntegrationSnapshot,
  SimulationPlayerActionInput,
} from "@/features/simulation-engine/integration-contract";
import type { SimulationIntegrationRuntime } from "@/features/simulation-engine/integration-runtime";
import { serializeSimulationCheckpoint } from "@/features/simulation-engine/persistence";
import type { ScenarioDefinition } from "@/features/simulation-engine/types";

export type SimulationExperienceAttemptInput = SimulationAttemptCompletion & {
  scenarioSlug: string;
  levelNumber: number;
};

export type SimulationExperienceAttemptResult = {
  status: "saved" | "duplicate" | "error";
  message: string;
};

export type SimulationExperiencePersistence = {
  loadLatestCheckpoint: (scenarioDefinitionId: string) => Promise<string | null>;
  saveCheckpoint: (serializedCheckpoint: string) => Promise<void>;
  deleteCheckpoint: (sessionId: string) => Promise<void>;
  saveAttempt?: (
    input: SimulationExperienceAttemptInput,
  ) => Promise<SimulationExperienceAttemptResult>;
};

export type OpenSimulationExperienceInput = {
  definition: ScenarioDefinition;
  seed: string;
  catalogs: SimulationCatalogs;
  generation?: DynamicScenarioGenerationOptions;
  persistence?: SimulationExperiencePersistence;
};

export type SimulationExperienceState = {
  source: SimulationBootstrapSource;
  sessionId: string;
  seed: string;
  dirty: boolean;
  lastSavedEventCount: number;
  snapshot: SimulationIntegrationSnapshot;
};

export type FinalizeSimulationExperienceInput = {
  scenarioSlug: string;
  levelNumber: number;
};

export type FinalizeSimulationExperienceResult = {
  status: SimulationExperienceAttemptResult["status"];
  message: string;
  attemptId: string;
  checkpointDeleted: boolean;
  completion: SimulationAttemptCompletion;
};

/**
 * Presentation-facing controller for a playable simulation experience.
 *
 * UI layers should prefer this controller over importing bootstrap, runtime,
 * checkpoint serialization, SafetyEngine or evaluators directly.
 */
export class SimulationExperienceController {
  readonly #runtime: SimulationIntegrationRuntime;
  readonly #persistence?: SimulationExperiencePersistence;
  readonly #source: SimulationBootstrapSource;
  readonly #sessionId: string;
  readonly #seed: string;
  #dirty = false;
  #lastSavedEventCount: number;

  private constructor(input: {
    runtime: SimulationIntegrationRuntime;
    persistence?: SimulationExperiencePersistence;
    source: SimulationBootstrapSource;
    sessionId: string;
    seed: string;
    initialEventCount: number;
  }) {
    this.#runtime = input.runtime;
    this.#persistence = input.persistence;
    this.#source = input.source;
    this.#sessionId = input.sessionId;
    this.#seed = input.seed;
    this.#lastSavedEventCount = input.initialEventCount;
  }

  static async open(input: OpenSimulationExperienceInput) {
    const bootstrapped = await bootstrapSimulationRuntime({
      definition: input.definition,
      seed: input.seed,
      catalogs: input.catalogs,
      generation: input.generation,
      loadLatestCheckpoint: input.persistence?.loadLatestCheckpoint,
    });

    return new SimulationExperienceController({
      runtime: bootstrapped.runtime,
      persistence: input.persistence,
      source: bootstrapped.source,
      sessionId: bootstrapped.sessionId,
      seed: bootstrapped.seed,
      initialEventCount: bootstrapped.snapshot.session.eventCount,
    });
  }

  state(): SimulationExperienceState {
    return {
      source: this.#source,
      sessionId: this.#sessionId,
      seed: this.#seed,
      dirty: this.#dirty,
      lastSavedEventCount: this.#lastSavedEventCount,
      snapshot: this.#runtime.snapshot(),
    };
  }

  dispatch(action: SimulationPlayerActionInput): SimulationIntegrationDispatchReceipt {
    const receipt = this.#runtime.dispatchPlayer(action);
    this.#dirty = receipt.snapshot.session.eventCount !== this.#lastSavedEventCount;
    return receipt;
  }

  async save(): Promise<SimulationExperienceState> {
    if (!this.#persistence) {
      throw new Error("Simulation experience does not define a persistence adapter.");
    }

    const checkpoint = this.#runtime.checkpoint();
    await this.#persistence.saveCheckpoint(serializeSimulationCheckpoint(checkpoint));
    this.#lastSavedEventCount = checkpoint.events.length;
    this.#dirty = false;
    return this.state();
  }

  async finalize(
    input: FinalizeSimulationExperienceInput,
  ): Promise<FinalizeSimulationExperienceResult> {
    if (!this.#persistence?.saveAttempt) {
      throw new Error("Simulation experience does not define an attempt persistence adapter.");
    }

    // Persist the terminal checkpoint first. If score/XP persistence fails, the
    // completed experience remains recoverable and can be retried safely.
    if (this.#dirty) await this.save();

    const completion = await buildSimulationAttemptCompletion(this.#runtime.checkpoint());
    const attempt = await this.#persistence.saveAttempt({
      ...completion,
      scenarioSlug: input.scenarioSlug,
      levelNumber: input.levelNumber,
    });

    if (attempt.status === "error") {
      return {
        status: attempt.status,
        message: attempt.message,
        attemptId: completion.attemptId,
        checkpointDeleted: false,
        completion,
      };
    }

    await this.#persistence.deleteCheckpoint(this.#sessionId);
    this.#lastSavedEventCount = this.#runtime.snapshot().session.eventCount;
    this.#dirty = false;

    return {
      status: attempt.status,
      message: attempt.message,
      attemptId: completion.attemptId,
      checkpointDeleted: true,
      completion,
    };
  }

  async discard(): Promise<void> {
    if (!this.#persistence) {
      throw new Error("Simulation experience does not define a persistence adapter.");
    }

    await this.#persistence.deleteCheckpoint(this.#sessionId);
    this.#lastSavedEventCount = this.#runtime.snapshot().session.eventCount;
    this.#dirty = false;
  }
}
