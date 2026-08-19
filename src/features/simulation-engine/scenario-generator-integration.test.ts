import { describe, expect, it } from "vitest";

import {
  buildExpectedTray,
  createSimulationSession,
  evaluateDeliverySafety,
  evaluateStorage,
  expectedPrescriptionDisposition,
  generateScenarioDefinition,
  reinforcementVariantForSeed,
  type ReinforcementCompetency,
  type SimulationSession,
} from "@/features/simulation-engine";

function seedForChallenge(competency: ReinforcementCompetency, challengeKey: string) {
  for (let seed = 1; seed < 20_000; seed += 1) {
    if (reinforcementVariantForSeed(seed, competency).challengeKey === challengeKey) return seed;
  }
  throw new Error(`No seed found for ${competency}:${challengeKey}`);
}

function reinforcementScenario(competency: ReinforcementCompetency, challengeKey: string) {
  const seed = seedForChallenge(competency, challengeKey);
  return generateScenarioDefinition({
    id: `reinforcement__${competency}__${seed.toString(36)}__`,
    mode: "practice",
    seed,
  });
}

describe("materialized reinforcement challenges", () => {
  it("turns wrong-quantity into a real editable preparation trap while keeping the tray empty", () => {
    const scenario = reinforcementScenario("preparation-comparison", "preparation-wrong-quantity");
    expect(scenario.reinforcementChallengeKey).toBe("preparation-wrong-quantity");
    expect(scenario.initialTray.items).toEqual([]);

    const primaryLine = scenario.prescriptions[0].lines[0];
    const suggestion = scenario.suggestedPreparationQuantityByLineId?.[primaryLine.id];
    expect(suggestion).toBeTypeOf("number");
    expect(suggestion).not.toBe(primaryLine.quantity);

    const expectedTray = buildExpectedTray(scenario);
    expectedTray.items[0] = { ...expectedTray.items[0], quantity: suggestion ?? primaryLine.quantity };
    const prescriptionDispositionById = Object.fromEntries(
      scenario.prescriptionsRelevantToCurrentWithdrawal.map((prescriptionId) => {
        const prescription = scenario.prescriptions.find((item) => item.id === prescriptionId);
        if (!prescription) throw new Error(`Missing prescription ${prescriptionId}`);
        return [prescriptionId, expectedPrescriptionDisposition(prescription)];
      }),
    ) as SimulationSession["prescriptionDispositionById"];
    const session: SimulationSession = {
      ...createSimulationSession(scenario),
      loadedPatientId: scenario.patient.id,
      finalReidentifiedPatientId: scenario.patient.id,
      verifiedPrescriptionIds: [...scenario.prescriptionsRelevantToCurrentWithdrawal],
      prescriptionDispositionById,
      tray: expectedTray,
    };

    expect(evaluateDeliverySafety(scenario, session).map((item) => item.kind)).toContain("quantity");
  });

  it("gives each patient-identification challenge an observable context", () => {
    const previous = reinforcementScenario("patient-identification", "patient-previous-record");
    const similar = reinforcementScenario("patient-identification", "patient-similar-identity");
    const ambiguous = reinforcementScenario("patient-identification", "patient-ambiguous-context");

    expect(previous.initialClinicalSystemState).toBe("previous_patient_open");
    expect(previous.similarPatients).toHaveLength(1);
    expect(similar.initialClinicalSystemState).toBe("clean_search");
    expect(similar.similarPatients).toHaveLength(1);
    expect(ambiguous.initialClinicalSystemState).toBe("previous_patient_open");
    expect(ambiguous.similarPatients.length).toBeGreaterThanOrEqual(2);
  });

  it("materializes prescription-review challenge differences", () => {
    const pending = reinforcementScenario("prescription-review", "prescription-pending-status");
    const historical = reinforcementScenario("prescription-review", "prescription-historical-lookalike");
    const multiple = reinforcementScenario("prescription-review", "prescription-multiple-establishments");

    expect(pending.prescriptions[0].status).toBe("pending");
    expect(historical.prescriptions[2].apparentlyDuplicateOf).toBe(historical.prescriptions[0].id);
    expect(historical.prescriptions[2].lines[0].medicationPresentationId)
      .toBe(historical.prescriptions[0].lines[0].medicationPresentationId);
    expect(multiple.prescriptions[0].establishmentId).not.toBe(multiple.prescriptions[1].establishmentId);
  });

  it("materializes distinct final-identification contexts", () => {
    const similar = reinforcementScenario("final-identification", "final-similar-identity");
    const previous = reinforcementScenario("final-identification", "final-previous-record");
    const handoff = reinforcementScenario("final-identification", "final-handoff-recheck");

    expect(similar.initialClinicalSystemState).toBe("clean_search");
    expect(similar.similarPatients).toHaveLength(1);
    expect(previous.initialClinicalSystemState).toBe("previous_patient_open");
    expect(previous.similarPatients).toHaveLength(1);
    expect(handoff.initialClinicalSystemState).toBe("clean_search");
    expect(handoff.similarPatients).toHaveLength(0);
  });

  it("encodes the exact instruction section targeted by each instructions challenge", () => {
    const cases = [
      ["instructions-purpose", "purpose"],
      ["instructions-schedule-administration", "schedule-administration"],
      ["instructions-precautions", "precautions"],
      ["instructions-qf-escalation", "qf-escalation"],
    ] as const;

    for (const [challengeKey, section] of cases) {
      const scenario = reinforcementScenario("instructions", challengeKey);
      expect(scenario.reinforcementChallengeKey).toBe(challengeKey);
      expect(scenario.reinforcementInstructionFocusSection).toBe(section);
    }
  });
});

describe("normal scenario diversity", () => {
  it("uses all synthetic patients and a broad set of real Atención Abierta presentations", () => {
    const patients = new Set<string>();
    const medicationPresentations = new Set<string>();

    for (let seed = 1; seed <= 64; seed += 1) {
      const scenario = generateScenarioDefinition({ id: `diversity-${seed}`, mode: "practice", seed });
      patients.add(scenario.patient.id);
      for (const prescriptionId of scenario.prescriptionsRelevantToCurrentWithdrawal) {
        const record = scenario.prescriptions.find((item) => item.id === prescriptionId);
        for (const line of record?.lines ?? []) {
          medicationPresentations.add(line.medicationPresentationId);
          expect(scenario.arsenal.find((item) => item.id === line.medicationPresentationId)?.careSetting)
            .toBe("atencion-abierta");
        }
      }
      expect(scenario.initialTray.items).toEqual([]);
      expect(evaluateStorage(scenario)).toEqual([]);
    }

    expect(patients.size).toBe(8);
    expect(medicationPresentations.size).toBeGreaterThan(20);
  });

  it("varies generated extra records instead of cloning only the case-001 medication lines", () => {
    const scenario = generateScenarioDefinition({ id: "diverse-assessment", mode: "assessment", seed: 903 });
    const presentationIds = new Set(
      scenario.prescriptions.flatMap((record) => record.lines.map((line) => line.medicationPresentationId)),
    );
    expect(scenario.prescriptions).toHaveLength(12);
    expect(presentationIds.size).toBeGreaterThan(5);
    expect(scenario.version).toBe("2.6.0-generated");
  });
});