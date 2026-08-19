import { describe, expect, it } from "vitest";

import { alternativeStrengthPresentations } from "@/data/simulation/arsenal";
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

function selectTens1(session: SimulationSession, scenario: ScenarioDefinition) {
  return executeSimulationCommand(
    scenario,
    session,
    { type: "role.selected", actorId, data: { selectedRole: "tens-1" } },
    now,
  );
}

function readySession(scenario: ScenarioDefinition = scenario001): SimulationSession {
  let session = createSimulationSession(scenario, { sessionId: "test-session", startedAt: now });
  session = selectTens1(session, scenario);
  return {
    ...session,
    loadedPatientId: scenario.patient.id,
    verifiedPrescriptionIds: [...scenario.prescriptionsRelevantToCurrentWithdrawal],
    tray: buildExpectedTray(scenario),
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

function recordPreparationCheck(
  session: SimulationSession,
  scenario: ScenarioDefinition = scenario001,
) {
  let next = session;
  for (const prescriptionId of scenario.prescriptionsRelevantToCurrentWithdrawal) {
    next = executeSimulationCommand(
      scenario,
      next,
      { type: "prescription.opened", actorId, data: { prescriptionId } },
      now,
    );
    next = executeSimulationCommand(
      scenario,
      next,
      { type: "prescription.status_verified", actorId, data: { prescriptionId } },
      now,
    );
  }
  for (const item of buildExpectedTray(scenario).items) {
    next = executeSimulationCommand(
      scenario,
      next,
      {
        type: "medication.inspected",
        actorId,
        data: { medicationPresentationId: item.medicationPresentationId },
      },
      now,
    );
    next = executeSimulationCommand(
      scenario,
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

  it("B. ERROR DE CONCENTRACIÓN uses two real Atención Abierta Carvedilol strengths", () => {
    const scenario = structuredClone(scenario001);
    scenario.id = "audit-b-real-strength";
    scenario.prescriptions[0].lines[0].medicationPresentationId = "trakcare-004-0308"; // CARVEDILOL 12,5 MG
    scenario.drawers[0] = {
      ...scenario.drawers[0],
      id: "drawer-carvedilol",
      expectedMedicationPresentationId: "trakcare-004-0308",
      expectedLabel: "CARVEDILOL 12,5 mg · Comprimidos",
      displayedLabel: "CARVEDILOL 12,5 mg · Comprimidos",
      contents: ["trakcare-004-0308", "trakcare-004-0251"],
    };

    expect(alternativeStrengthPresentations("trakcare-004-0308").map((item) => item.id)).toEqual(
      expect.arrayContaining(["trakcare-004-0251", "trakcare-004-0321"]),
    );

    const session = readySession(scenario);
    session.tray.items[0] = {
      ...session.tray.items[0],
      medicationPresentationId: "trakcare-004-0251", // CARVEDILOL 25 MG
    };
    const result = attempt(session, scenario);
    expect(result.deliveryStatus).toBe("blocked");
    expect(result.discrepancies.map((item) => item.kind)).toContain("strength");
  });

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
    scenario.drawers[0].contents.push("trakcare-004-0087");
    const deviations = evaluateStorage(scenario);
    expect(deviations.map((item) => item.kind)).toContain("mixed-product");

    const session = createSimulationSession(scenario, { sessionId: "storage-only", startedAt: now });
    expect(session.storageDeviations.map((item) => item.kind)).toContain("mixed-product");
    expect(session.discrepancies).toEqual([]);
  });

  it("F. GAVETA INCORRECTA → PREPARACIÓN INCORRECTA becomes a medication discrepancy only after selection", () => {
    const scenario = structuredClone(scenario001);
    scenario.drawers[0].contents.push("trakcare-004-0087");
    const session = readySession(scenario);
    session.tray.items[0] = {
      ...session.tray.items[0],
      medicationPresentationId: "trakcare-004-0087",
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
  it("requires an explicit TENS role before accepting simulation actions", () => {
    let session = createSimulationSession(scenario001, { sessionId: "role-required", startedAt: now });
    expect(session.selectedPlayerRole).toBeNull();
    expect(session.actorControllers["tens-1"]).toBe("simulation");
    expect(session.actorControllers["tens-2"]).toBe("simulation");

    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "patient.focused", actorId },
      now,
    );
    expect(session.focusedObjectId).toBeNull();
    expect(session.eventLog).toEqual([]);
  });

  it("opening a prescription does not verify its status", () => {
    let session = createSimulationSession(scenario001, { sessionId: "rx-open", startedAt: now });
    session = selectTens1(session, scenario001);
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
    session = selectTens1(session, scenario001);
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
