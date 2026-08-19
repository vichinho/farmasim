import { describe, expect, it } from "vitest";

import {
  createSimulationSession,
  evaluateStorage,
  generateScenarioDefinition,
  recommendReinforcement,
  reinforcementVariantForSeed,
  type ReinforcementVariantFingerprint,
  type SimulationSession,
} from "@/features/simulation-engine";

function withPreparationFailure(session: SimulationSession): SimulationSession {
  return {
    ...session,
    criteria: {
      ...session.criteria,
      "criterion-5-compare-prepared-items": "reinforcement",
    },
  };
}

function expectDifferentVariant(
  next: ReinforcementVariantFingerprint,
  previous: ReinforcementVariantFingerprint,
) {
  expect(next.patientId).not.toBe(previous.patientId);
  expect(next.medicationId).not.toBe(previous.medicationId);
  expect(next.presentationId).not.toBe(previous.presentationId);
  expect(next.establishmentId).not.toBe(previous.establishmentId);
  expect(next.challengeKey).not.toBe(previous.challengeKey);
}

function seedForChallenge(challengeKey: string) {
  for (let seed = 1; seed < 10_000; seed += 1) {
    if (reinforcementVariantForSeed(seed, "preparation-comparison").challengeKey === challengeKey) return seed;
  }
  throw new Error(`No seed found for ${challengeKey}`);
}

describe("adaptive reinforcement memory", () => {
  it("rotates patient, medication, presentation, establishment and exact challenge across recent reinforcements", () => {
    const baseScenario = generateScenarioDefinition({ id: "adaptive-base", mode: "practice", seed: 20260818 });
    const baseSession = withPreparationFailure(createSimulationSession(baseScenario));

    const first = recommendReinforcement(baseSession);
    expect(first).not.toBeNull();
    if (!first) return;

    const firstScenario = generateScenarioDefinition({
      id: first.scenarioId,
      mode: "practice",
      seed: first.seed,
    });
    expect(firstScenario.version).toBe("2.4.0-reinforcement");
    expect(firstScenario.patient.id).toBe(first.variant.patientId);
    expect(firstScenario.prescriptions[0].establishmentId).toBe(first.variant.establishmentId);
    expect(firstScenario.prescriptions[0].lines[0].medicationPresentationId).toBe(first.variant.presentationId);

    const second = recommendReinforcement(withPreparationFailure(createSimulationSession(firstScenario)));
    expect(second).not.toBeNull();
    if (!second) return;
    expectDifferentVariant(second.variant, first.variant);

    const secondScenario = generateScenarioDefinition({
      id: second.scenarioId,
      mode: "practice",
      seed: second.seed,
    });
    const third = recommendReinforcement(withPreparationFailure(createSimulationSession(secondScenario)));
    expect(third).not.toBeNull();
    if (!third) return;

    expectDifferentVariant(third.variant, second.variant);
    expectDifferentVariant(third.variant, first.variant);
  });

  it("builds wrong-strength reinforcement only from real same-medication Atención Abierta presentations", () => {
    const seed = seedForChallenge("preparation-wrong-strength");
    const id = `reinforcement__preparation-comparison__${seed.toString(36)}__`;
    const scenario = generateScenarioDefinition({ id, mode: "practice", seed });
    const primaryDrawer = scenario.drawers[0];
    const presentations = primaryDrawer.contents.map((presentationId) =>
      scenario.arsenal.find((item) => item.id === presentationId),
    );

    expect(presentations).toHaveLength(2);
    expect(presentations.every(Boolean)).toBe(true);
    const [expected, alternative] = presentations;
    expect(expected?.careSetting).toBe("atencion-abierta");
    expect(alternative?.careSetting).toBe("atencion-abierta");
    expect(alternative?.medicationId).toBe(expected?.medicationId);
    expect(alternative?.strength).not.toBe(expected?.strength);
    expect(evaluateStorage(scenario).map((item) => item.kind)).toContain("mixed-strength");
  });

  it("builds wrong-product reinforcement as a storage deviation before selection", () => {
    const seed = seedForChallenge("preparation-wrong-product");
    const id = `reinforcement__preparation-comparison__${seed.toString(36)}__`;
    const scenario = generateScenarioDefinition({ id, mode: "practice", seed });
    const primaryDrawer = scenario.drawers[0];
    const presentations = primaryDrawer.contents.map((presentationId) =>
      scenario.arsenal.find((item) => item.id === presentationId),
    );

    expect(presentations).toHaveLength(2);
    expect(presentations[0]?.medicationId).not.toBe(presentations[1]?.medicationId);
    expect(evaluateStorage(scenario).map((item) => item.kind)).toContain("mixed-product");
  });
});
