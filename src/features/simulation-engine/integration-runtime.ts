import {
  deriveSimulationIntegrationSnapshot,
  resolvePlayerActor,
} from "@/features/simulation-engine/integration-contract";
import type {
  SimulationIntegrationDispatchReceipt,
  SimulationIntegrationSnapshot,
  SimulationPlayerActionInput,
} from "@/features/simulation-engine/integration-contract";
import {
  createSimulationCheckpoint,
} from "@/features/simulation-engine/persistence";
import type { SimulationCheckpoint } from "@/features/simulation-engine/persistence";
import { SimulationRuntime } from "@/features/simulation-engine/runtime";
import type {
  ScenarioDefinition,
  SimulationActionInput,
  SimulationDispatchReceipt,
  SimulationEvent,
  SimulationSession,
} from "@/features/simulation-engine/types";

function integrationReceipt(
  session: SimulationSession,
  receipt: SimulationDispatchReceipt,
): SimulationIntegrationDispatchReceipt {
  return {
    acceptedAction: {
      eventId: receipt.actionEvent.id,
      type: receipt.actionEvent.type,
    },
    generatedEvents: receipt.generatedEvents.map((event) => ({
      eventId: event.id,
      type: event.type,
    })),
    snapshot: deriveSimulationIntegrationSnapshot(session, receipt.snapshot.events),
  };
}

/**
 * Stable boundary intended for presentation layers.
 *
 * UI/3D/mobile code should prefer this wrapper instead of importing evaluators,
 * SafetyEngine, material-state, inventory-state or internal runtime snapshots.
 */
export class SimulationIntegrationRuntime {
  readonly #runtime: SimulationRuntime;

  constructor(
    private readonly definition: ScenarioDefinition,
    private readonly session: SimulationSession,
    initialEvents: readonly SimulationEvent[] = [],
  ) {
    this.#runtime = new SimulationRuntime(definition, session, initialEvents);
  }

  static fromCheckpoint(checkpoint: SimulationCheckpoint) {
    return new SimulationIntegrationRuntime(
      checkpoint.definition,
      checkpoint.session,
      checkpoint.events,
    );
  }

  snapshot(): SimulationIntegrationSnapshot {
    return deriveSimulationIntegrationSnapshot(
      this.session,
      this.#runtime.snapshot().events,
    );
  }

  checkpoint(savedAt?: string): SimulationCheckpoint {
    return createSimulationCheckpoint(
      this.definition,
      this.session,
      this.#runtime.snapshot().events,
      savedAt,
    );
  }

  dispatchPlayer(
    action: SimulationPlayerActionInput,
  ): SimulationIntegrationDispatchReceipt {
    const player = resolvePlayerActor(this.session);
    const receipt = this.#runtime.dispatch({
      ...action,
      actorId: player.id,
    });
    return integrationReceipt(this.session, receipt);
  }

  /**
   * Reserved for simulation-controlled actors and future multiplayer adapters.
   * Presentation code for the local player should use dispatchPlayer().
   */
  dispatchActor(action: SimulationActionInput): SimulationIntegrationDispatchReceipt {
    return integrationReceipt(this.session, this.#runtime.dispatch(action));
  }
}
