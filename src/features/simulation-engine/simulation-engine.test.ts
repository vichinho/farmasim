import { describe, expect, it } from "vitest";

import { scenario001 } from "@/data/simulation/scenario-001";
import {
  buildExpectedTray,
  createSimulationSession,
  evaluateDeliverySafety,
  executeSimulationCommand,
  generateScenarioDefinition,
  recommendReinforcement,
  type SimulationSession,
} from "@/features/simulation-engine";

const actorId = "tens-1";
const now = "2026-08-18T12:00:00.000Z";

function readySession(): SimulationSession {
  return {
    ...createSimulationSession(scenario001, { sessionId: "test-session", startedAt: now }),
    loadedPatientId: scenario001.patient.id,
    verifiedPrescriptionIds: [...scenario001.expectedPrescriptionIds],
    tray: buildExpectedTray(scenario001),
  };
}

function attempt(session: SimulationSession) {
  return executeSimulationCommand(
    scenario001,
    session,
    { type: "delivery.attempted", actorId },
    now,
  );
}

describe("SimulationEngine safety barrier", () => {
  it("completes a correct preparation", () => {
    const result = attempt(readySession());
    expect(result.deliveryStatus).toBe("completed");
    expect(result.discrepancies).toEqual([]);
    expect(result.eventLog.at(-1)?.type).toBe("delivery.completed");
  });

  it("blocks an incorrect concentration", () => {
    const session = readySession();
    session.tray.items[0] = {
      ...session.tray.items[0],
      medicationPresentationId: "losartan-100-tablet-30",
    };
    const result = attempt(session);
    expect(result.deliveryStatus).toBe("blocked");
    expect(result.discrepancies.map((item) => item.kind)).toContain("strength");
  });

  it("blocks an omitted prescription line", () => {
    const session = readySession();
    session.tray.items = session.tray.items.filter(
      (item) => item.prescriptionLineId !== "line-amlodipine",
    );
    const result = attempt(session);
    expect(result.discrepancies.map((item) => item.kind)).toContain("omission");
  });

  it("blocks an unverified prescription", () => {
    const session = readySession();
    session.verifiedPrescriptionIds = [scenario001.expectedPrescriptionIds[0]];
    const result = attempt(session);
    expect(result.discrepancies.map((item) => item.kind)).toContain("prescription");
  });

  it("replaces the physical tray when a correction is applied", () => {
    let session = readySession();
    session.tray.items[0] = {
      ...session.tray.items[0],
      medicationPresentationId: "losartan-100-tablet-30",
    };
    session = attempt(session);
    expect(session.deliveryStatus).toBe("blocked");
    session = executeSimulationCommand(
      scenario001,
      session,
      { type: "tray.corrected", actorId: "tens-2" },
      now,
    );
    expect(session.deliveryStatus).toBe("not-attempted");
    expect(session.tray.items[0].medicationPresentationId).toBe("losartan-50-tablet-30");
    expect(attempt(session).deliveryStatus).toBe("completed");
  });

  it("remembers that a medication was opened from the tray", () => {
    let session = readySession();
    session.focusedObjectId = "tray";
    session = executeSimulationCommand(
      scenario001,
      session,
      {
        type: "medication.inspected",
        actorId,
        data: { medicationPresentationId: "losartan-100-tablet-30" },
      },
      now,
    );
    expect(session.focusReturnObjectId).toBe("tray");
  });

  it("returns to the tray after a blocked delivery", () => {
    const blocked = attempt({
      ...readySession(),
      tray: {
        ...readySession().tray,
        items: readySession().tray.items.map((item, index) => index === 0
          ? { ...item, medicationPresentationId: "losartan-100-tablet-30" }
          : item),
      },
    });
    const inspecting = executeSimulationCommand(
      scenario001,
      blocked,
      { type: "tray.inspected", actorId },
      now,
    );

    expect(inspecting.deliveryStatus).toBe("not-attempted");
    expect(inspecting.focusedObjectId).toBe("tray");
    expect(inspecting.discrepancies.map((item) => item.kind)).toContain("strength");
  });

  it("blocks a wrong patient", () => {
    const session = readySession();
    session.loadedPatientId = scenario001.similarPatients[0].id;
    const result = attempt(session);
    expect(result.discrepancies.map((item) => item.kind)).toContain("patient");
  });

  it("blocks wrong form, quantity and an additional product", () => {
    const session = readySession();
    session.tray.items[1] = {
      ...session.tray.items[1],
      medicationPresentationId: "amlodipine-5-capsule-30",
      quantity: 60,
    };
    session.tray.items.push({
      id: "extra",
      medicationPresentationId: "paracetamol-500-tablet-20",
      quantity: 20,
    });
    const kinds = evaluateDeliverySafety(scenario001, session).map((item) => item.kind);
    expect(kinds).toEqual(
      expect.arrayContaining(["pharmaceutical-form", "quantity", "additional-product"]),
    );
  });
});

describe("criteria derived from EventLog", () => {
  it("derives observable criteria without direct assignments", () => {
    let session = createSimulationSession(scenario001, {
      sessionId: "criteria-session",
      startedAt: now,
    });
    const commands = [
      { type: "document.requested" as const },
      { type: "rut.typed" as const, data: { rut: scenario001.patient.rut } },
      { type: "search.executed" as const, data: { rut: scenario001.patient.rut } },
      { type: "patient_record.opened" as const, data: { patientId: scenario001.patient.id } },
      ...scenario001.expectedPrescriptionIds.flatMap((prescriptionId) => [
        { type: "prescription.opened" as const, data: { prescriptionId } },
        { type: "prescription.status_verified" as const, data: { prescriptionId } },
      ]),
      { type: "identity.rechecked" as const },
      { type: "instructions.given" as const },
    ];
    for (const command of commands) {
      session = executeSimulationCommand(
        scenario001,
        session,
        { ...command, actorId },
        now,
      );
    }
    session = { ...session, tray: buildExpectedTray(scenario001) };
    session = attempt(session);

    expect(Object.values(session.criteria)).toEqual([
      "met",
      "met",
      "met",
      "met",
      "met",
      "met",
      "met",
    ]);
  });
});

describe("scenario generation and reinforcement", () => {
  it("scales record complexity by mode deterministically", () => {
    const guided = generateScenarioDefinition({ id: "generated-guided", mode: "guided", seed: 11 });
    const practice = generateScenarioDefinition({ id: "generated-practice", mode: "practice", seed: 11 });
    const assessment = generateScenarioDefinition({ id: "generated-assessment", mode: "assessment", seed: 11 });
    expect(guided.prescriptions).toHaveLength(3);
    expect(practice.prescriptions).toHaveLength(5);
    expect(assessment.prescriptions).toHaveLength(12);
    expect(generateScenarioDefinition({ id: "generated-assessment", mode: "assessment", seed: 11 })).toEqual(assessment);
  });

  it("recommends a new reinforcement scenario for the failed competency", () => {
    const session = readySession();
    session.criteria["criterion-3-identify-all-prescriptions"] = "reinforcement";
    session.criteria["criterion-4-confirm-prescription-issued"] = "reinforcement";
    const first = recommendReinforcement(session);
    expect(first?.competency).toBe("prescription-review");
    const second = recommendReinforcement(session, first ? [first.scenarioId] : []);
    expect(second?.scenarioId).not.toBe(first?.scenarioId);
  });
});
