import { describe, expect, it } from "vitest";

import { scenario001 } from "@/data/simulation/scenario-001";
import {
  buildExpectedTray,
  createSimulationSession,
  evaluateDeliverySafety,
  evaluateStorage,
  executeSimulationCommand,
  generateScenarioDefinition,
  type ScenarioDefinition,
  type SimulationSession,
} from "@/features/simulation-engine";

const actorId = "tens-1";
const now = "2026-08-18T12:00:00.000Z";

function readySession(): SimulationSession {
  return {
    ...createSimulationSession(scenario001, { sessionId: "test-session", startedAt: now }),
    loadedPatientId: scenario001.patient.id,
    verifiedPrescriptionIds: [...scenario001.prescriptionsRelevantToCurrentWithdrawal],
    tray: buildExpectedTray(scenario001),
  };
}

function attempt(session: SimulationSession, scenario: ScenarioDefinition = scenario001) {
  return executeSimulationCommand(
    scenario,
    session,
    { type: "delivery.attempted", actorId },
    now,
  );
}

function recordPreparationCheck(session: SimulationSession) {
  let next = session;
  for (const prescriptionId of scenario001.prescriptionsRelevantToCurrentWithdrawal) {
    next = executeSimulationCommand(
      scenario001,
      next,
      { type: "prescription.opened", actorId, data: { prescriptionId } },
      now,
    );
    next = executeSimulationCommand(
      scenario001,
      next,
      { type: "prescription.status_verified", actorId, data: { prescriptionId } },
      now,
    );
  }
  for (const item of buildExpectedTray(scenario001).items) {
    next = executeSimulationCommand(
      scenario001,
      next,
      {
        type: "medication.inspected",
        actorId,
        data: { medicationPresentationId: item.medicationPresentationId },
      },
      now,
    );
    next = executeSimulationCommand(
      scenario001,
      next,
      {
        type: "medication.compared_to_prescription",
        actorId,
        data: { prescriptionLineId: item.prescriptionLineId },
      },
      now,
    );
  }
  return next;
}

describe("mandatory structural audit scenarios", () => {
  it("A. TODO CORRECTO has no hidden environment or delivery deviations", () => {
    const session = recordPreparationCheck(readySession());
    expect(evaluateStorage(scenario001)).toEqual([]);
    const result = attempt(session);
    expect(result.deliveryStatus).toBe("completed");
    expect(result.discrepancies).toEqual([]);
    expect(result.criteria["criterion-5-compare-prepared-items"]).toBe("met");
  });

  it.skip("B. ERROR DE CONCENTRACIÓN requires a real second Atención Abierta strength from the authoritative arsenal");

  it("C. MÚLTIPLES REGISTROS + PRESCRIPCIÓN OMITIDA separates history from current withdrawal", () => {
    expect(scenario001.visibleClinicalRecordIds).toContain("rx-historical-003");
    expect(scenario001.availablePrescriptionIds).not.toContain("rx-historical-003");
    expect(scenario001.prescriptionsRelevantToCurrentWithdrawal).not.toContain("rx-historical-003");

    const session = readySession();
    session.tray.items = session.tray.items.filter(
      (item) => item.prescriptionLineId !== "line-amlodipine",
    );
    expect(evaluateDeliverySafety(scenario001, session).map((item) => item.kind)).toContain("omission");
  });

  it("D. PACIENTE INCORRECTO reinforces identity without changing criterion 5", () => {
    let session = recordPreparationCheck(readySession());
    session.loadedPatientId = scenario001.similarPatients[0].id;
    const result = attempt(session);
    expect(result.discrepancies.map((item) => item.kind)).toContain("patient");
    expect(result.criteria["criterion-5-compare-prepared-items"]).toBe("met");
  });

  it("E. GAVETA INCORRECTA is detected even when the wrong product is never selected", () => {
    const scenario = structuredClone(scenario001);
    scenario.drawers[0].contents.push("paracetamol-500-tablet-20");
    const deviations = evaluateStorage(scenario);
    expect(deviations.map((item) => item.kind)).toContain("mixed-product");

    const session = createSimulationSession(scenario, { sessionId: "storage-only", startedAt: now });
    expect(session.storageDeviations.map((item) => item.kind)).toContain("mixed-product");
    expect(session.discrepancies).toEqual([]);
  });

  it("F. GAVETA INCORRECTA → PREPARACIÓN INCORRECTA becomes a medication discrepancy only after selection", () => {
    const scenario = structuredClone(scenario001);
    scenario.drawers[0].contents.push("paracetamol-500-tablet-20");
    let session = readySession();
    session = { ...session, scenarioId: scenario.id };
    session.tray.items[0] = {
      ...session.tray.items[0],
      medicationPresentationId: "paracetamol-500-tablet-20",
    };
    const kinds = evaluateDeliverySafety(scenario, session).map((item) => item.kind);
    expect(evaluateStorage(scenario).map((item) => item.kind)).toContain("mixed-product");
    expect(kinds).toContain("medication");
  });

  it("G. PREPARACIÓN CORRECTA SIN DOBLE CHEQUEO completes pharmacologically but does not meet criterion 5", () => {
    const result = attempt(readySession());
    expect(result.deliveryStatus).toBe("completed");
    expect(result.discrepancies).toEqual([]);
    expect(result.criteria["criterion-5-compare-prepared-items"]).toBe("pending");
  });
});

describe("event semantics", () => {
  it("opening a prescription does not verify its status", () => {
    let session = createSimulationSession(scenario001, { sessionId: "rx-open", startedAt: now });
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "prescription.opened", actorId, data: { prescriptionId: "rx-tome-001" } },
      now,
    );
    expect(session.openedPrescriptionIds).toContain("rx-tome-001");
    expect(session.verifiedPrescriptionIds).not.toContain("rx-tome-001");
  });

  it("changes real controllers when TENS 2 is selected", () => {
    let session = createSimulationSession(scenario001, { sessionId: "role", startedAt: now });
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "role.selected", actorId, data: { selectedRole: "tens-2" } },
      now,
    );
    expect(session.activeActorId).toBe("tens-2");
    expect(session.actorControllers["tens-1"]).toBe("simulation");
    expect(session.actorControllers["tens-2"]).toBe("participant");
  });

  it("records PC tabs and scrolling independently", () => {
    let session = createSimulationSession(scenario001, { sessionId: "pc", startedAt: now });
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "tab.opened", actorId, data: { tabId: "prescriptions" } },
      now,
    );
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "record.scrolled", actorId, data: { recordId: "rx-tome-001" } },
      now,
    );
    expect(session.openedTabIds).toEqual(["prescriptions"]);
    expect(session.scrolledRecordIds).toEqual(["rx-tome-001"]);
  });
});

describe("scenario generation", () => {
  it("scales visible record complexity deterministically without injecting fake medication errors", () => {
    const guided = generateScenarioDefinition({ id: "generated-guided", mode: "guided", seed: 11 });
    const practice = generateScenarioDefinition({ id: "generated-practice", mode: "practice", seed: 11 });
    const assessment = generateScenarioDefinition({ id: "generated-assessment", mode: "assessment", seed: 11 });
    expect(guided.prescriptions).toHaveLength(3);
    expect(practice.prescriptions).toHaveLength(5);
    expect(assessment.prescriptions).toHaveLength(12);
    expect(guided.initialTray.items).toEqual([]);
    expect(practice.initialTray.items).toEqual([]);
    expect(assessment.initialTray.items).toEqual([]);
    expect(generateScenarioDefinition({ id: "generated-assessment", mode: "assessment", seed: 11 })).toEqual(assessment);
  });
});
