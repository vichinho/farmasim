import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";
import { SimulationIntegrationRuntime } from "@/features/simulation-engine/integration-runtime";
import {
  parseSimulationCheckpoint,
  serializeSimulationCheckpoint,
  SimulationCheckpointError,
} from "@/features/simulation-engine/persistence";

function fixture(id: "A" | "E") {
  const found = minimumScenarioFixtures.find((item) => item.id === id);
  if (!found) throw new Error(`Minimum scenario ${id} is required for persistence diagnostics.`);
  return found;
}

function semanticallyEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function buildPersistenceReport() {
  const attentionFixture = fixture("A");
  const attentionRuntime = new SimulationIntegrationRuntime(
    attentionFixture.definition,
    attentionFixture.session,
  );

  attentionRuntime.dispatchPlayer({
    type: "document.requested",
    targetType: "document",
    targetId: "patient-marta-document",
  });
  attentionRuntime.dispatchPlayer({
    type: "document.opened",
    targetType: "document",
    targetId: "patient-marta-document",
  });
  attentionRuntime.dispatchPlayer({
    type: "computer.focused",
    targetType: "computer",
    targetId: "clinical-terminal",
  });
  attentionRuntime.dispatchPlayer({
    type: "rut.typed",
    targetType: "patient",
    targetId: "patient-marta",
    metadata: { value: "12.345.678-9" },
  });
  attentionRuntime.dispatchPlayer({
    type: "search.executed",
    targetType: "patient",
    metadata: { resultPatientId: "patient-marta" },
  });
  attentionRuntime.dispatchPlayer({
    type: "patient_record.opened",
    targetType: "record",
    targetId: "record-marta",
  });

  const attentionBefore = attentionRuntime.snapshot();
  const attentionCheckpoint = attentionRuntime.checkpoint("2026-08-17T23:00:00.000Z");
  const attentionSerialized = serializeSimulationCheckpoint(attentionCheckpoint);
  const attentionRestored = SimulationIntegrationRuntime.fromCheckpoint(
    parseSimulationCheckpoint(attentionSerialized),
  );
  const attentionAfter = attentionRestored.snapshot();
  const attentionReplayEqual = semanticallyEqual(attentionBefore, attentionAfter);

  const nextClinicalReceipt = attentionRestored.dispatchPlayer({
    type: "prescription.opened",
    targetType: "prescription",
    targetId: "rx-losartan",
  });

  const preparationFixture = fixture("E");
  const preparationRuntime = new SimulationIntegrationRuntime(
    preparationFixture.definition,
    preparationFixture.session,
  );

  preparationRuntime.dispatchPlayer({
    type: "storage.entered",
    targetType: "storage",
    targetId: "sector-L",
  });
  preparationRuntime.dispatchPlayer({
    type: "drawer.label_inspected",
    targetType: "drawer",
    targetId: "drawer-l-mixed",
  });
  preparationRuntime.dispatchPlayer({
    type: "drawer.opened",
    targetType: "drawer",
    targetId: "drawer-l-mixed",
  });
  preparationRuntime.dispatchPlayer({
    type: "drawer.contents_inspected",
    targetType: "drawer",
    targetId: "drawer-l-mixed",
  });
  preparationRuntime.dispatchPlayer({
    type: "medication.taken",
    targetType: "medication",
    targetId: "drawer-l-mixed-item-1",
    metadata: { quantity: 1 },
  });

  const preparationBefore = preparationRuntime.snapshot();
  const preparationCheckpoint = preparationRuntime.checkpoint("2026-08-17T23:05:00.000Z");
  const preparationSerialized = serializeSimulationCheckpoint(preparationCheckpoint);
  const preparationRestored = SimulationIntegrationRuntime.fromCheckpoint(
    parseSimulationCheckpoint(preparationSerialized),
  );
  const preparationAfter = preparationRestored.snapshot();
  const preparationReplayEqual = semanticallyEqual(preparationBefore, preparationAfter);

  preparationRestored.dispatchPlayer({
    type: "medication.inspected",
    targetType: "medication",
    targetId: "drawer-l-mixed-item-1",
  });
  preparationRestored.dispatchPlayer({
    type: "medication.added_to_tray",
    targetType: "medication",
    targetId: "drawer-l-mixed-item-1",
    metadata: { quantity: 1 },
  });
  preparationRestored.dispatchPlayer({
    type: "preparation.confirmed",
    targetType: "tray",
    targetId: "tray-resumed",
  });
  preparationRestored.dispatchPlayer({
    type: "tray.sent",
    targetType: "tray",
    targetId: "tray-resumed",
  });
  const preparationContinued = preparationRestored.snapshot();

  let corruptedCheckpointRejected = false;
  try {
    const corrupted = JSON.parse(attentionSerialized) as {
      events: Array<{ sequence: number }>;
    };
    if (corrupted.events[0]) corrupted.events[0].sequence = 99;
    parseSimulationCheckpoint(JSON.stringify(corrupted));
  } catch (error) {
    corruptedCheckpointRejected =
      error instanceof SimulationCheckpointError && error.code === "event_sequence_invalid";
  }

  return {
    checkpointVersion: attentionCheckpoint.checkpointVersion,
    attention: {
      serializedBytes: attentionSerialized.length,
      eventCountBefore: attentionBefore.session.eventCount,
      eventCountAfterRestore: attentionAfter.session.eventCount,
      replayEqual: attentionReplayEqual,
      activePatientId: attentionAfter.clinicalSystem.activePatientId,
      openedRecordIds: attentionAfter.clinicalSystem.openedRecordIds,
      nextEventType: nextClinicalReceipt.acceptedAction.type,
      nextEventCount: nextClinicalReceipt.snapshot.session.eventCount,
    },
    preparation: {
      serializedBytes: preparationSerialized.length,
      eventCountBefore: preparationBefore.session.eventCount,
      eventCountAfterRestore: preparationAfter.session.eventCount,
      replayEqual: preparationReplayEqual,
      heldBefore: preparationBefore.preparation.heldItems,
      heldAfter: preparationAfter.preparation.heldItems,
      stockBefore: preparationBefore.storage.drawers.find((drawer) => drawer.id === "drawer-l-mixed"),
      stockAfter: preparationAfter.storage.drawers.find((drawer) => drawer.id === "drawer-l-mixed"),
      continuedEventCount: preparationContinued.session.eventCount,
      continuedTrayItems: preparationContinued.preparation.trayItems,
      continuedHandoff: preparationContinued.handoff,
    },
    guards: {
      corruptedCheckpointRejected,
    },
  };
}
