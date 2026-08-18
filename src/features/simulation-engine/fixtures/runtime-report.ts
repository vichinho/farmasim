import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";
import { SimulationRuntime, SimulationRuntimeError } from "@/features/simulation-engine/runtime";
import type {
  MinimumScenarioFixture,
} from "@/features/simulation-engine/fixtures/minimum-scenarios";
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

function runtimeActionsForFixture(fixture: MinimumScenarioFixture): SimulationActionInput[] {
  const actions = fixture.events.map(eventToAction);
  if (fixture.id !== "E") return actions;

  const sendIndex = actions.findIndex((action) => action.type === "tray.sent");
  if (sendIndex < 0) return actions;

  return [
    ...actions.slice(0, sendIndex),
    {
      actorId: "actor-preparation",
      type: "preparation.confirmed",
      targetType: "tray",
      targetId: "tray-1",
      timestamp: "2026-08-17T20:07:30.000Z",
    },
    ...actions.slice(sendIndex),
  ];
}

function expectedStatus(fixtureId: string): SimulationRuntimeStatus {
  if (fixtureId === "B" || fixtureId === "D") return "delivery-blocked";
  if (fixtureId === "A" || fixtureId === "C") return "completed";
  return "running";
}

export function buildRuntimeReport() {
  return minimumScenarioFixtures.map((fixture) => {
    const runtime = new SimulationRuntime(fixture.definition, fixture.session);
    const actions = runtimeActionsForFixture(fixture);
    const receipts = runtime.dispatchMany(actions);
    const snapshot = runtime.snapshot();
    const material = runtime.materialSnapshot();
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
      trayItems: material.trayItems,
      heldItems: material.heldItems,
      preparationWorkflow: runtime.preparationWorkflowSnapshot(),
      finalEvent: snapshot.events.at(-1)?.type ?? null,
    };
  });
}

export function buildBlockedDeliveryRecoveryReport() {
  const fixture = minimumScenarioFixtures.find((item) => item.id === "B");
  if (!fixture) throw new Error("Minimum scenario B is required for runtime recovery diagnostics.");

  const runtime = new SimulationRuntime(fixture.definition, fixture.session);
  runtime.dispatchMany(runtimeActionsForFixture(fixture));
  const blocked = runtime.snapshot();

  const correctionActions: SimulationActionInput[] = [
    {
      actorId: "actor-attention",
      type: "correction.requested",
      targetType: "tray",
      targetId: "tray-1",
      timestamp: "2026-08-17T21:30:00.000Z",
    },
    {
      actorId: "actor-attention",
      type: "medication.returned",
      targetType: "medication",
      targetId: "losartan-100",
      metadata: { quantity: 1 },
      timestamp: "2026-08-17T21:31:00.000Z",
    },
    {
      actorId: "actor-attention",
      type: "drawer.opened",
      targetType: "drawer",
      targetId: "drawer-l-01",
      timestamp: "2026-08-17T21:31:30.000Z",
    },
    {
      actorId: "actor-attention",
      type: "medication.taken",
      targetType: "medication",
      targetId: "drawer-l-01-item-1",
      metadata: { quantity: 1 },
      timestamp: "2026-08-17T21:32:00.000Z",
    },
    {
      actorId: "actor-attention",
      type: "medication.added_to_tray",
      targetType: "medication",
      targetId: "drawer-l-01-item-1",
      metadata: { quantity: 1 },
      timestamp: "2026-08-17T21:33:00.000Z",
    },
    {
      actorId: "actor-attention",
      type: "tray.inspected",
      targetType: "tray",
      targetId: "tray-1",
      timestamp: "2026-08-17T21:34:00.000Z",
    },
    {
      actorId: "actor-attention",
      type: "medication.inspected",
      targetType: "medication",
      targetId: "losartan-50",
      timestamp: "2026-08-17T21:35:00.000Z",
    },
    {
      actorId: "actor-attention",
      type: "delivery.attempted",
      targetType: "patient",
      targetId: "patient-marta",
      timestamp: "2026-08-17T21:36:00.000Z",
    },
  ];

  const receipts = runtime.dispatchMany(correctionActions);
  const completed = runtime.snapshot();
  const material = runtime.materialSnapshot();
  const inventory = runtime.inventorySnapshot();

  return {
    blockedStatus: blocked.status,
    blockedEvent: blocked.events.at(-1)?.type ?? null,
    blockedDiscrepancies: blocked.evaluation.safety.blockingDiscrepancyIds.length,
    correctionActions: correctionActions.length,
    correctionGeneratedEvents: receipts.reduce(
      (total, receipt) => total + receipt.generatedEvents.length,
      0,
    ),
    completedStatus: completed.status,
    completedEvent: completed.events.at(-1)?.type ?? null,
    finalBlockingDiscrepancies: completed.evaluation.safety.blockingDiscrepancyIds.length,
    deliveryBlockedEvents: completed.events.filter((event) => event.type === "delivery.blocked").length,
    deliveryCompletedEvents: completed.events.filter((event) => event.type === "delivery.completed").length,
    trayItems: material.trayItems,
    heldItems: material.heldItems,
    drawerStock: inventory.drawers.find((drawer) => drawer.drawerId === "drawer-l-01") ?? null,
    eventCount: completed.eventCount,
  };
}

export function buildRuntimeStockReport() {
  const fixture = minimumScenarioFixtures.find((item) => item.id === "A");
  if (!fixture) throw new Error("Minimum scenario A is required for stock diagnostics.");

  const runtime = new SimulationRuntime(fixture.definition, fixture.session);
  const drawerId = "drawer-l-01";
  const itemId = "drawer-l-01-item-1";
  const drawer = () => runtime.inventorySnapshot().drawers.find((item) => item.drawerId === drawerId);

  runtime.dispatch({
    actorId: "actor-attention",
    type: "drawer.opened",
    targetType: "drawer",
    targetId: drawerId,
  });

  const initial = drawer();
  let overdrawRejected = false;

  try {
    runtime.dispatch({
      actorId: "actor-attention",
      type: "medication.taken",
      targetType: "medication",
      targetId: itemId,
      metadata: { quantity: 7 },
    });
  } catch (error) {
    overdrawRejected = error instanceof SimulationRuntimeError && error.code === "insufficient_stock";
  }

  runtime.dispatch({
    actorId: "actor-attention",
    type: "medication.taken",
    targetType: "medication",
    targetId: itemId,
    metadata: { quantity: 5 },
  });
  const low = drawer();

  runtime.dispatch({
    actorId: "actor-attention",
    type: "medication.taken",
    targetType: "medication",
    targetId: itemId,
    metadata: { quantity: 1 },
  });
  const empty = drawer();

  runtime.dispatch({
    actorId: "actor-attention",
    type: "medication.returned",
    targetType: "medication",
    targetId: itemId,
    metadata: { quantity: 1 },
  });
  const restored = drawer();

  return {
    drawerId,
    itemId,
    overdrawRejected,
    initial,
    low,
    empty,
    restored,
    material: runtime.materialSnapshot(),
    eventCount: runtime.snapshot().eventCount,
  };
}

export function buildPreparationWorkflowReport() {
  const fixture = minimumScenarioFixtures.find((item) => item.id === "E");
  if (!fixture) throw new Error("Minimum scenario E is required for preparation workflow diagnostics.");

  const runtime = new SimulationRuntime(fixture.definition, fixture.session);
  const actions = runtimeActionsForFixture(fixture);
  runtime.dispatchMany(actions);
  const snapshot = runtime.snapshot();
  const material = runtime.materialSnapshot();
  const inventory = runtime.inventorySnapshot();
  const workflow = runtime.preparationWorkflowSnapshot();

  const guardRuntime = new SimulationRuntime(fixture.definition, fixture.session);
  let sendBeforeConfirmRejected = false;
  try {
    guardRuntime.dispatch({
      actorId: "actor-preparation",
      type: "tray.sent",
      targetType: "tray",
      targetId: "tray-guard",
    });
  } catch (error) {
    sendBeforeConfirmRejected =
      error instanceof SimulationRuntimeError && error.code === "preparation_not_confirmed";
  }

  const heldRuntime = new SimulationRuntime(fixture.definition, fixture.session);
  heldRuntime.dispatchMany([
    {
      actorId: "actor-preparation",
      type: "drawer.opened",
      targetType: "drawer",
      targetId: "drawer-l-mixed",
    },
    {
      actorId: "actor-preparation",
      type: "medication.taken",
      targetType: "medication",
      targetId: "drawer-l-mixed-item-1",
      metadata: { quantity: 1 },
    },
  ]);
  let confirmWhileHoldingRejected = false;
  try {
    heldRuntime.dispatch({
      actorId: "actor-preparation",
      type: "preparation.confirmed",
      targetType: "tray",
      targetId: "tray-held",
    });
  } catch (error) {
    confirmWhileHoldingRejected =
      error instanceof SimulationRuntimeError && error.code === "held_medication_pending";
  }

  const wrongRuntime = new SimulationRuntime(fixture.definition, fixture.session);
  const wrongActions: SimulationActionInput[] = [
    { actorId: "actor-preparation", type: "storage.entered", targetType: "storage", targetId: "sector-L" },
    { actorId: "actor-preparation", type: "drawer.label_inspected", targetType: "drawer", targetId: "drawer-l-mixed" },
    { actorId: "actor-preparation", type: "drawer.opened", targetType: "drawer", targetId: "drawer-l-mixed" },
    { actorId: "actor-preparation", type: "drawer.contents_inspected", targetType: "drawer", targetId: "drawer-l-mixed" },
    { actorId: "actor-preparation", type: "medication.taken", targetType: "medication", targetId: "drawer-l-mixed-item-2" },
    { actorId: "actor-preparation", type: "medication.inspected", targetType: "medication", targetId: "drawer-l-mixed-item-2" },
    { actorId: "actor-preparation", type: "medication.added_to_tray", targetType: "medication", targetId: "drawer-l-mixed-item-2" },
    { actorId: "actor-preparation", type: "preparation.confirmed", targetType: "tray", targetId: "tray-wrong" },
    { actorId: "actor-preparation", type: "tray.sent", targetType: "tray", targetId: "tray-wrong" },
  ];
  wrongRuntime.dispatchMany(wrongActions);
  const wrongSnapshot = wrongRuntime.snapshot();

  return {
    correct: {
      actions: actions.length,
      finalEvent: snapshot.events.at(-1)?.type ?? null,
      workflow,
      trayItems: material.trayItems,
      heldItems: material.heldItems,
      drawerStock: inventory.drawers.find((drawer) => drawer.drawerId === "drawer-l-mixed") ?? null,
      processDeviations: snapshot.evaluation.processDeviations.map((item) => item.type),
      blockingDiscrepancies: snapshot.evaluation.safety.blockingDiscrepancyIds.length,
    },
    guards: {
      sendBeforeConfirmRejected,
      sendBeforeConfirmEventCount: guardRuntime.snapshot().eventCount,
      confirmWhileHoldingRejected,
      confirmWhileHoldingEventCount: heldRuntime.snapshot().eventCount,
    },
    wrongHandoff: {
      finalEvent: wrongSnapshot.events.at(-1)?.type ?? null,
      workflow: wrongRuntime.preparationWorkflowSnapshot(),
      trayItems: wrongRuntime.materialSnapshot().trayItems,
      blockingDiscrepancies: wrongSnapshot.evaluation.safety.blockingDiscrepancyIds.length,
      systemDeliveryEvents: wrongSnapshot.events.filter(
        (event) => event.type === "delivery.blocked" || event.type === "delivery.completed",
      ).length,
    },
  };
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
