import { SimulationIntegrationRuntime } from "@/features/simulation-engine/integration-runtime";
import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";

function fixtureById(id: "A" | "E") {
  const fixture = minimumScenarioFixtures.find((item) => item.id === id);
  if (!fixture) throw new Error(`Minimum scenario ${id} is required for integration diagnostics.`);
  return fixture;
}

export function buildIntegrationContractReport() {
  const attentionFixture = fixtureById("A");
  const attention = new SimulationIntegrationRuntime(
    attentionFixture.definition,
    attentionFixture.session,
  );
  const attentionInitial = attention.snapshot();
  const attentionReceipt = attention.dispatchPlayer({
    type: "document.requested",
    targetType: "document",
    targetId: "patient-marta-document",
    timestamp: "2026-08-17T22:30:00.000Z",
  });

  const preparationFixture = fixtureById("E");
  const preparation = new SimulationIntegrationRuntime(
    preparationFixture.definition,
    preparationFixture.session,
  );
  const preparationInitial = preparation.snapshot();

  preparation.dispatchPlayer({
    type: "storage.entered",
    targetType: "storage",
    targetId: "sector-L",
  });
  preparation.dispatchPlayer({
    type: "drawer.opened",
    targetType: "drawer",
    targetId: "drawer-l-mixed",
  });
  preparation.dispatchPlayer({
    type: "medication.taken",
    targetType: "medication",
    targetId: "drawer-l-mixed-item-1",
  });
  preparation.dispatchPlayer({
    type: "medication.added_to_tray",
    targetType: "medication",
    targetId: "drawer-l-mixed-item-1",
  });
  preparation.dispatchPlayer({
    type: "preparation.confirmed",
    targetType: "tray",
    targetId: "tray-contract",
  });
  const beforeSend = preparation.snapshot();
  const sendReceipt = preparation.dispatchPlayer({
    type: "tray.sent",
    targetType: "tray",
    targetId: "tray-contract",
  });
  const afterSend = preparation.snapshot();

  const serialized = JSON.stringify({ attentionInitial, preparationInitial, afterSend });
  const forbiddenKeys = [
    "evaluation",
    "criteria",
    "competencies",
    "blockingDiscrepancies",
    "expectedLabel",
    "expectedMedicationPresentationId",
  ];

  return {
    contractVersion: attentionInitial.contractVersion,
    attention: {
      role: attentionInitial.player.role,
      actorIdHiddenFromCommand: attentionReceipt.acceptedAction.type === "document.requested",
      canUseClinicalSystem: attentionInitial.capabilities.canUseClinicalSystem,
      canAccessStorage: attentionInitial.capabilities.canAccessStorage,
      eventCountAfterCommand: attentionReceipt.snapshot.session.eventCount,
    },
    preparation: {
      role: preparationInitial.player.role,
      canAccessStorageInitially: preparationInitial.capabilities.canAccessStorage,
      canSendBeforeConfirmation: preparationInitial.capabilities.canSendTray,
      canSendAfterConfirmation: beforeSend.capabilities.canSendTray,
      handoffAfterSend: afterSend.handoff,
      canSendAfterSend: afterSend.capabilities.canSendTray,
      trayItems: afterSend.preparation.trayItems,
      acceptedSendType: sendReceipt.acceptedAction.type,
    },
    privacy: {
      forbiddenKeys,
      leakedKeys: forbiddenKeys.filter((key) => serialized.includes(`\"${key}\"`)),
    },
  };
}
