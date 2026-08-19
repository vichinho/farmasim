import { describe, expect, it } from "vitest";

import { scenario001 } from "@/data/simulation/scenario-001";
import { ambulatoryArsenal, alternativeStrengthPresentations } from "@/data/simulation/arsenal";
import {
  buildExpectedTray,
  createSimulationSession,
  evaluateDeliverySafety,
  evaluateStorage,
  executeSimulationCommand,
  expectedPrescriptionDisposition,
  generateScenarioDefinition,
  reinforcementVariantForSeed,
  type ScenarioDefinition,
  type SimulationSession,
} from "@/features/simulation-engine";

const actorId = "tens-1";
const now = "2026-08-18T12:00:00.000Z";

function selectTens1(scenario: ScenarioDefinition, session: SimulationSession) {
  return executeSimulationCommand(
    scenario,
    session,
    { type: "role.selected", actorId, data: { selectedRole: "tens-1" } },
    now,
  );
}

function dispositionMap(scenario: ScenarioDefinition) {
  return Object.fromEntries(
    scenario.prescriptionsRelevantToCurrentWithdrawal.map((prescriptionId) => {
      const prescription = scenario.prescriptions.find((item) => item.id === prescriptionId);
      if (!prescription) throw new Error(`Missing prescription ${prescriptionId}`);
      return [prescriptionId, expectedPrescriptionDisposition(prescription)];
    }),
  ) as SimulationSession["prescriptionDispositionById"];
}

function readySession(scenario: ScenarioDefinition = scenario001): SimulationSession {
  const selected = selectTens1(
    scenario,
    createSimulationSession(scenario, { sessionId: "test-session", startedAt: now }),
  );
  return {
    ...selected,
    loadedPatientId: scenario.patient.id,
    verifiedPrescriptionIds: [...scenario.prescriptionsRelevantToCurrentWithdrawal],
    prescriptionDispositionById: dispositionMap(scenario),
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

function recordPreparationCheck(session: SimulationSession, scenario: ScenarioDefinition = scenario001) {
  let next = session;
  for (const prescriptionId of scenario.availablePrescriptionIds) {
    next = executeSimulationCommand(
      scenario,
      next,
      { type: "prescription.opened", actorId, data: { prescriptionId } },
      now,
    );
    if (scenario.prescriptionsRelevantToCurrentWithdrawal.includes(prescriptionId)) {
      const prescription = scenario.prescriptions.find((item) => item.id === prescriptionId);
      if (!prescription) continue;
      next = executeSimulationCommand(
        scenario,
        next,
        {
          type: "prescription.status_verified",
          actorId,
          data: {
            prescriptionId,
            disposition: expectedPrescriptionDisposition(prescription),
          },
        },
        now,
      );
    }
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

function seedForPrescriptionChallenge(challengeKey: string) {
  for (let seed = 1; seed < 10_000; seed += 1) {
    if (reinforcementVariantForSeed(seed, "prescription-review").challengeKey === challengeKey) return seed;
  }
  throw new Error(`No seed found for ${challengeKey}`);
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

  it("B. ERROR DE CONCENTRACIÓN uses two real Atención Abierta strengths of the same medication", () => {
    const carvedilol125 = ambulatoryArsenal.find((item) => item.id === "trakcare-004-0308");
    const carvedilol25 = ambulatoryArsenal.find((item) => item.id === "trakcare-004-0251");
    expect(carvedilol125?.medicationName).toBe("Carvedilol");
    expect(carvedilol125?.strength).toBe("12.5 MG");
    expect(carvedilol25?.medicationName).toBe("Carvedilol");
    expect(carvedilol25?.strength).toBe("25 MG");
    expect(alternativeStrengthPresentations("trakcare-004-0308").map((item) => item.id)).toContain("trakcare-004-0251");

    const scenario = structuredClone(scenario001);
    scenario.prescriptions[0].lines[0].medicationPresentationId = "trakcare-004-0308";
    scenario.prescriptions[0].lines[0].quantity = 1;
    const selected = selectTens1(
      scenario,
      createSimulationSession(scenario, { sessionId: "real-strength", startedAt: now }),
    );
    const session: SimulationSession = {
      ...selected,
      loadedPatientId: scenario.patient.id,
      verifiedPrescriptionIds: [...scenario.prescriptionsRelevantToCurrentWithdrawal],
      prescriptionDispositionById: dispositionMap(scenario),
      tray: {
        ...scenario.initialTray,
        status: "received" as const,
        items: [{
          id: "wrong-carvedilol-strength",
          prescriptionLineId: scenario.prescriptions[0].lines[0].id,
          medicationPresentationId: "trakcare-004-0251",
          quantity: 1,
        }],
      },
    };
    expect(evaluateDeliverySafety(scenario, session).map((item) => item.kind)).toContain("strength");
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
    const session = recordPreparationCheck(readySession());
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
    const session = readySession();
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

describe("prescription integration semantics", () => {
  it("criterion 3 requires every available prescription, not only current-withdrawal prescriptions", () => {
    const scenario = structuredClone(scenario001);
    scenario.prescriptions[2].status = "accepted";
    scenario.availablePrescriptionIds = [
      ...scenario.availablePrescriptionIds,
      scenario.prescriptions[2].id,
    ];
    let session = selectTens1(scenario, createSimulationSession(scenario, { sessionId: "available-rx", startedAt: now }));

    for (const prescriptionId of scenario.prescriptionsRelevantToCurrentWithdrawal) {
      const prescription = scenario.prescriptions.find((item) => item.id === prescriptionId);
      if (!prescription) continue;
      session = executeSimulationCommand(
        scenario,
        session,
        { type: "prescription.opened", actorId, data: { prescriptionId } },
        now,
      );
      session = executeSimulationCommand(
        scenario,
        session,
        {
          type: "prescription.status_verified",
          actorId,
          data: { prescriptionId, disposition: expectedPrescriptionDisposition(prescription) },
        },
        now,
      );
    }

    expect(session.criteria["criterion-3-identify-all-prescriptions"]).toBe("pending");
    session = executeSimulationCommand(
      scenario,
      session,
      { type: "prescription.opened", actorId, data: { prescriptionId: scenario.prescriptions[2].id } },
      now,
    );
    expect(session.criteria["criterion-3-identify-all-prescriptions"]).toBe("met");
  });

  it("a pending prescription requires hold-for-review and can end as a safe QF stop", () => {
    const seed = seedForPrescriptionChallenge("prescription-pending-status");
    const scenario = generateScenarioDefinition({
      id: `reinforcement__prescription-review__${seed.toString(36)}__`,
      mode: "guided",
      seed,
    });
    expect(scenario.requiredPlayerRole).toBe("tens-1");
    expect(scenario.prescriptions[0].status).toBe("pending");

    let session = selectTens1(scenario, createSimulationSession(scenario, { sessionId: "pending-hold", startedAt: now }));
    for (const prescriptionId of scenario.availablePrescriptionIds) {
      session = executeSimulationCommand(
        scenario,
        session,
        { type: "prescription.opened", actorId, data: { prescriptionId } },
        now,
      );
      if (!scenario.prescriptionsRelevantToCurrentWithdrawal.includes(prescriptionId)) continue;
      const prescription = scenario.prescriptions.find((item) => item.id === prescriptionId);
      if (!prescription) continue;
      session = executeSimulationCommand(
        scenario,
        session,
        {
          type: "prescription.status_verified",
          actorId,
          data: { prescriptionId, disposition: expectedPrescriptionDisposition(prescription) },
        },
        now,
      );
    }

    expect(session.prescriptionDispositionById[scenario.prescriptions[0].id]).toBe("hold-for-review");
    expect(session.criteria["criterion-3-identify-all-prescriptions"]).toBe("met");
    expect(session.criteria["criterion-4-confirm-prescription-issued"]).toBe("intercepted");

    session = executeSimulationCommand(
      scenario,
      session,
      { type: "qf_support.requested", actorId },
      now,
    );
    expect(session.deliveryStatus).toBe("safely-stopped");
    expect(session.criteria["criterion-5-compare-prepared-items"]).toBe("intercepted");
  });

  it("does not accept a wrong proceed decision for a pending prescription", () => {
    const seed = seedForPrescriptionChallenge("prescription-pending-status");
    const scenario = generateScenarioDefinition({
      id: `reinforcement__prescription-review__${seed.toString(36)}__`,
      mode: "guided",
      seed,
    });
    let session = selectTens1(scenario, createSimulationSession(scenario, { sessionId: "pending-wrong", startedAt: now }));

    for (const prescriptionId of scenario.availablePrescriptionIds) {
      session = executeSimulationCommand(
        scenario,
        session,
        { type: "prescription.opened", actorId, data: { prescriptionId } },
        now,
      );
      if (!scenario.prescriptionsRelevantToCurrentWithdrawal.includes(prescriptionId)) continue;
      const prescription = scenario.prescriptions.find((item) => item.id === prescriptionId);
      if (!prescription) continue;
      session = executeSimulationCommand(
        scenario,
        session,
        {
          type: "prescription.status_verified",
          actorId,
          data: {
            prescriptionId,
            disposition: prescription.status === "pending" ? "proceed" : expectedPrescriptionDisposition(prescription),
          },
        },
        now,
      );
    }

    expect(session.criteria["criterion-4-confirm-prescription-issued"]).toBe("reinforcement");
    const afterQf = executeSimulationCommand(
      scenario,
      session,
      { type: "qf_support.requested", actorId },
      now,
    );
    expect(afterQf.deliveryStatus).toBe("not-attempted");
  });
});

describe("role semantics", () => {
  it("blocks scene interaction until an explicit player role is selected", () => {
    const session = createSimulationSession(scenario001, { sessionId: "role-gate", startedAt: now });
    expect(session.selectedPlayerRole).toBeNull();
    expect(session.actorControllers["tens-1"]).toBe("simulation");
    expect(session.actorControllers["tens-2"]).toBe("simulation");
    const ignored = executeSimulationCommand(
      scenario001,
      session,
      { type: "patient.focused", actorId: "tens-1" },
      now,
    );
    expect(ignored.focusedObjectId).toBeNull();
    expect(ignored.eventLog).toEqual([]);
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

  it("keeps the selected role immutable for the rest of the session", () => {
    let session = selectTens1(scenario001, createSimulationSession(scenario001, { sessionId: "role-lock", startedAt: now }));
    const eventCount = session.eventLog.length;
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "role.selected", actorId: "tens-2", data: { selectedRole: "tens-2" } },
      now,
    );
    expect(session.selectedPlayerRole).toBe("tens-1");
    expect(session.actorControllers["tens-1"]).toBe("participant");
    expect(session.actorControllers["tens-2"]).toBe("simulation");
    expect(session.eventLog).toHaveLength(eventCount);
  });

  it("rejects a role that does not match a reinforcement competency", () => {
    const scenario = generateScenarioDefinition({
      id: "targeted-preparation",
      mode: "practice",
      seed: 41,
      reinforcementCompetency: "preparation-comparison",
    });
    expect(scenario.requiredPlayerRole).toBe("tens-2");
    let session = createSimulationSession(scenario, { sessionId: "target-role", startedAt: now });
    session = executeSimulationCommand(
      scenario,
      session,
      { type: "role.selected", actorId: "tens-1", data: { selectedRole: "tens-1" } },
      now,
    );
    expect(session.selectedPlayerRole).toBeNull();
    expect(session.eventLog).toEqual([]);

    session = executeSimulationCommand(
      scenario,
      session,
      { type: "role.selected", actorId: "tens-2", data: { selectedRole: "tens-2" } },
      now,
    );
    expect(session.selectedPlayerRole).toBe("tens-2");
  });

  it("opening a prescription does not assess its status", () => {
    let session = createSimulationSession(scenario001, { sessionId: "rx-open", startedAt: now });
    session = selectTens1(scenario001, session);
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "prescription.opened", actorId, data: { prescriptionId: "rx-tome-001" } },
      now,
    );
    expect(session.openedPrescriptionIds).toContain("rx-tome-001");
    expect(session.verifiedPrescriptionIds).not.toContain("rx-tome-001");
    expect(session.prescriptionDispositionById["rx-tome-001"]).toBeUndefined();
  });

  it("records PC tabs and scrolling independently", () => {
    let session = createSimulationSession(scenario001, { sessionId: "pc", startedAt: now });
    session = selectTens1(scenario001, session);
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