import { describe, expect, it } from "vitest";

import { evaluateStorage, reinforcementVariantForSeed } from "@/features/simulation-engine";
import { buildPilotScenarioBank, pilotScenarioMatrix } from "./pilot-scenario-bank";

describe("pilot scenario bank", () => {
  it("has ten unique entries and balanced modes/difficulties", () => {
    expect(pilotScenarioMatrix).toHaveLength(10);
    expect(new Set(pilotScenarioMatrix.map((item) => item.id)).size).toBe(10);
    expect(pilotScenarioMatrix.filter((item) => item.mode === "guided")).toHaveLength(3);
    expect(pilotScenarioMatrix.filter((item) => item.mode === "practice")).toHaveLength(4);
    expect(pilotScenarioMatrix.filter((item) => item.mode === "assessment")).toHaveLength(3);
    expect(pilotScenarioMatrix.filter((item) => item.difficulty === "foundational")).toHaveLength(3);
    expect(pilotScenarioMatrix.filter((item) => item.difficulty === "standard")).toHaveLength(4);
    expect(pilotScenarioMatrix.filter((item) => item.difficulty === "advanced")).toHaveLength(3);
    expect(new Set(pilotScenarioMatrix.map((item) => item.competency)).size).toBe(5);
  });

  it("materializes the intended challenge and role with an empty tray", () => {
    for (const { spec, scenario } of buildPilotScenarioBank()) {
      expect(scenario.id).toBe(spec.id);
      expect(scenario.mode).toBe(spec.mode);
      expect(scenario.requiredPlayerRole).toBe(spec.playerRole);
      expect(scenario.reinforcementChallengeKey).toBe(spec.challengeKey);
      expect(scenario.initialTray.status).toBe("empty");
      expect(scenario.initialTray.items).toEqual([]);
      expect(reinforcementVariantForSeed(spec.seed, spec.competency).challengeKey).toBe(spec.challengeKey);
    }
  });

  it("rotates all eight synthetic identities and establishments in the first eight pilots", () => {
    const firstEight = buildPilotScenarioBank().slice(0, 8);
    expect(new Set(firstEight.map(({ scenario }) => scenario.patient.id)).size).toBe(8);
    expect(new Set(firstEight.map(({ scenario }) => scenario.prescriptions[0].establishmentId)).size).toBe(8);
  });

  it("does not duplicate an exact adaptive fingerprint", () => {
    const fingerprints = pilotScenarioMatrix.map((spec) => {
      const v = reinforcementVariantForSeed(spec.seed, spec.competency);
      return `${v.patientId}|${v.medicationId}|${v.presentationId}|${v.establishmentId}|${v.challengeKey}`;
    });
    expect(new Set(fingerprints).size).toBe(10);
  });

  it("covers several real Atención Abierta presentations", () => {
    const bank = buildPilotScenarioBank();
    const ids = new Set(bank.flatMap(({ scenario }) => scenario.prescriptions
      .filter((record) => scenario.prescriptionsRelevantToCurrentWithdrawal.includes(record.id))
      .flatMap((record) => record.lines.map((line) => line.medicationPresentationId))));
    expect(ids.size).toBeGreaterThanOrEqual(6);
    const arsenal = bank[0].scenario.arsenal;
    for (const id of ids) expect(arsenal.find((item) => item.id === id)?.careSetting).toBe("atencion-abierta");
  });

  it("keeps preparation pilots behaviorally distinct", () => {
    const bank = buildPilotScenarioBank();
    const strength = bank.find(({ spec }) => spec.challengeKey === "preparation-wrong-strength")?.scenario;
    const product = bank.find(({ spec }) => spec.challengeKey === "preparation-wrong-product")?.scenario;
    const quantity = bank.find(({ spec }) => spec.challengeKey === "preparation-wrong-quantity")?.scenario;
    expect(strength ? evaluateStorage(strength).map((item) => item.kind) : []).toContain("mixed-strength");
    expect(product ? evaluateStorage(product).map((item) => item.kind) : []).toContain("mixed-product");
    expect(quantity?.initialTray.items).toEqual([]);
    const line = quantity?.prescriptions
      .filter((record) => quantity.prescriptionsRelevantToCurrentWithdrawal.includes(record.id))[0]?.lines[0];
    const suggestion = line ? quantity?.suggestedPreparationQuantityByLineId?.[line.id] : undefined;
    expect(suggestion).toBeDefined();
    expect(suggestion).not.toBe(line?.quantity);
    expect(suggestion).toBeGreaterThan(0);
  });
});
