import { describe, expect, it } from "vitest";

import { scenario001 } from "@/data/simulation/scenario-001";
import {
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

describe("simulation alerts", () => {
  it("classifies a blocked wrong quantity as an intercepted medication discrepancy", () => {
    let session = selectTens1(createSimulationSession(scenario001, { sessionId: crypto.randomUUID(), startedAt: now }));
    session = {
      ...session,
      loadedPatientId: scenario001.patient.id,
      finalReidentifiedPatientId: scenario001.patient.id,
      verifiedPrescriptionIds: [...scenario001.prescriptionsRelevantToCurrentWithdrawal],
      prescriptionDispositionById: { "rx-tome-001": "proceed" },
      tray: {
        ...scenario001.initialTray,
        status: "received",
        items: [{
          id: "wrong-qty",
          prescriptionLineId: "line-losartan",
          medicationPresentationId: "trakcare-004-0137",
          quantity: 999,
        }],
      },
    };
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
    expect(quantity?.reachedPatient).toBe(false);
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
