import { describe, expect, it } from "vitest";

import { scenario001 } from "@/data/simulation/scenario-001";
import {
  buildExpectedTray,
  createSimulationSession,
  executeSimulationCommand,
  simulationAlertsFromSession,
  type SimulationSession,
} from "@/features/simulation-engine";

const now = "2026-08-19T12:00:00.000Z";

function selectTens1(session: SimulationSession) {
  return executeSimulationCommand(
    scenario001,
    session,
    { type: "role.selected", actorId: "tens-1", data: { selectedRole: "tens-1" } },
    now,
  );
}

function baseReadySession() {
  let session = selectTens1(createSimulationSession(scenario001, { sessionId: crypto.randomUUID(), startedAt: now }));
  session = {
    ...session,
    loadedPatientId: scenario001.patient.id,
    finalReidentifiedPatientId: scenario001.patient.id,
    verifiedPrescriptionIds: [...scenario001.prescriptionsRelevantToCurrentWithdrawal],
    prescriptionDispositionById: { "rx-tome-001": "proceed" },
    tray: buildExpectedTray(scenario001),
  };
  return session;
}

function wrongQuantitySession() {
  const session = baseReadySession();
  return {
    ...session,
    tray: {
      ...session.tray,
      status: "received" as const,
      items: session.tray.items.map((item, index) => index === 0 ? { ...item, quantity: item.quantity + 999 } : item),
    },
  };
}

describe("simulation alerts", () => {
  it("classifies a blocked wrong quantity as an intercepted medication discrepancy", () => {
    let session = wrongQuantitySession();
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "delivery.attempted", actorId: "tens-1" },
      now,
    );

    const alerts = simulationAlertsFromSession(scenario001, session);
    const quantity = alerts.find((item) => item.kind === "quantity");
    expect(quantity?.category).toBe("medication-discrepancy");
    expect(quantity?.originStage).toBe("preparation-check");
    expect(quantity?.severity).toBe("high");
    expect(quantity?.reachedPatient).toBe(false);
  });

  it("preserves an intercepted discrepancy after correction and successful completion", () => {
    let session = wrongQuantitySession();
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "delivery.attempted", actorId: "tens-1" },
      now,
    );
    expect(session.deliveryStatus).toBe("blocked");
    const blockedEvent = session.eventLog.findLast((event) => event.type === "delivery.blocked");
    expect(blockedEvent).toBeDefined();

    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "tray.corrected", actorId: "tens-2" },
      now,
    );
    expect(session.discrepancies).toEqual([]);

    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "delivery.attempted", actorId: "tens-1" },
      now,
    );
    expect(session.deliveryStatus).toBe("completed");
    expect(session.discrepancies).toEqual([]);

    const alerts = simulationAlertsFromSession(scenario001, session);
    const quantity = alerts.find((item) => item.kind === "quantity");
    expect(quantity?.category).toBe("medication-discrepancy");
    expect(quantity?.sourceEventId.startsWith(`${blockedEvent?.id}:`)).toBe(true);
    expect(quantity?.reachedPatient).toBe(false);
  });

  it("keeps a generic preparation alert when correction is proven but the exact discrepancy is unknown", () => {
    let session = baseReadySession();
    for (const item of buildExpectedTray(scenario001).items) {
      if (!item.prescriptionLineId) continue;
      session = executeSimulationCommand(
        scenario001,
        session,
        {
          type: "medication.compared_to_prescription",
          actorId: "tens-1",
          data: { prescriptionLineId: item.prescriptionLineId },
        },
        now,
      );
    }
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "correction.requested", actorId: "tens-1" },
      now,
    );
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "tray.corrected", actorId: "tens-2" },
      now,
    );
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "delivery.attempted", actorId: "tens-1" },
      now,
    );

    const preparation = simulationAlertsFromSession(scenario001, session).find((item) =>
      item.kind === "other" && item.originStage === "preparation-check",
    );
    expect(session.criteria["criterion-5-compare-prepared-items"]).toBe("intercepted");
    expect(preparation?.category).toBe("process-deviation");
    expect(preparation?.severity).toBe("moderate");
    expect(preparation?.metadata.criterionId).toBe("criterion-5-compare-prepared-items");
    expect(preparation?.reachedPatient).toBe(false);
  });

  it("records storage separately only after the drawer has been inspected", () => {
    const scenario = structuredClone(scenario001);
    scenario.drawers[0].contents.push("trakcare-004-0087");
    let session = selectTens1(createSimulationSession(scenario, { sessionId: crypto.randomUUID(), startedAt: now }));
    expect(simulationAlertsFromSession(scenario, session).filter((item) => item.category === "storage-deviation")).toEqual([]);

    session = executeSimulationCommand(
      scenario,
      session,
      { type: "drawer.contents_inspected", actorId: "tens-1", data: { drawerId: scenario.drawers[0].id } },
      now,
    );
    const storage = simulationAlertsFromSession(scenario, session).find((item) => item.category === "storage-deviation");
    expect(storage?.kind).toBe("storage");
    expect(storage?.metadata.storageDeviationKind).toBe("mixed-product");
    expect(storage?.reachedPatient).toBe(false);
  });
});
