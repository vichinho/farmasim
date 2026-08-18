import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";
import { SimulationRuntime, SimulationRuntimeError } from "@/features/simulation-engine/runtime";
import type {
  SimulationActionInput,
  SimulationEvent,
  SimulationRuntimeStatus,
} from "@/features/simulation-engine/types";

function eventToAction(event: SimulationEvent): SimulationActionInput {
  if (event.type === "delivery.blocked" || event.type === "delivery.completed") {
    throw new Error(`Fixture event ${event.type} is runtime-generated and cannot be replayed as an external action.`);
  }

  return {
    actorId: event.actorId,
    type: event.type,
    targetType: event.targetType,
    targetId: event.targetId,
    metadata: event.metadata,
    timestamp: event.timestamp,
  };
}

function expectedStatus(fixtureId: string): SimulationRuntimeStatus {
  if (fixtureId === "B" || fixtureId === "D") return "delivery-blocked";
  if (fixtureId === "A" || fixtureId === "C") return "completed";
  return "running";
}

export function buildRuntimeReport() {
  return minimumScenarioFixtures.map((fixture) => {
    const runtime = new SimulationRuntime(fixture.definition, fixture.session);
    const actions = fixture.events.map(eventToAction);
    const receipts = runtime.dispatchMany(actions);
    const snapshot = runtime.snapshot();
    const generatedEventCount = receipts.reduce(
      (total, receipt) => total + receipt.generatedEvents.length,
      0,
    );

    return {
      id: fixture.id,
      title: fixture.title,
      expectedStatus: expectedStatus(fixture.id),
      status: snapshot.status,
      externalActions: actions.length,
      generatedEvents: generatedEventCount,
      eventCount: snapshot.eventCount,
      activePatientId: snapshot.state.activePatientId,
      safetyAllowed: snapshot.evaluation.safety.allowed,
      blockingDiscrepancies: snapshot.evaluation.safety.blockingDiscrepancyIds.length,
      finalEvent: snapshot.events.at(-1)?.type ?? null,
    };
  });
}

export function runtimeRejectsInvalidAction(): boolean {
  const fixture = minimumScenarioFixtures[0];
  if (!fixture) return false;

  const runtime = new SimulationRuntime(fixture.definition, fixture.session);

  try {
    runtime.dispatch({
      actorId: "actor-that-does-not-exist",
      type: "patient_record.opened",
      targetType: "record",
      targetId: "record-that-does-not-exist",
    });
  } catch (error) {
    return error instanceof SimulationRuntimeError && error.code === "unknown_actor";
  }

  return false;
}
