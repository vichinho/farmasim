import { describe, expect, it } from "vitest";

import {
  buildRecentVariantMemory,
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

function expectDifferentImmediateContext(
  next: ReinforcementVariantFingerprint,
  previous: ReinforcementVariantFingerprint,
) {
  expect(next.drawerId).not.toBe(previous.drawerId);
  expect(next.visualContextKey).not.toBe(previous.visualContextKey);
}

function seedForChallenge(challengeKey: string) {
  for (let seed = 1; seed < 10_000; seed += 1) {
    if (reinforcementVariantForSeed(seed, "preparation-comparison").challengeKey === challengeKey) return seed;
  }
  throw new Error(`No seed found for ${challengeKey}`);
}

describe("adaptive reinforcement memory", () => {
  it("rotates patient, medication, presentation, facility, error, drawer and immediate context", () => {
    const baseScenario = generateScenarioDefinition({ id: "adaptive-base", mode: "practice", seed: 20260818 });
    const baseSession = withPreparationFailure(createSimulationSession(baseScenario));

    const first = recommendReinforcement(baseSession);
    expect(first).not.toBeNull();
    if (!first) return;
    expect(first.targetPlayerRole).toBe("tens-2");

    const firstScenario = generateScenarioDefinition({
      id: first.scenarioId,
      mode: "practice",
      seed: first.seed,
    });
    expect(firstScenario.version).toBe("2.8.0-reinforcement");
    expect(firstScenario.requiredPlayerRole).toBe("tens-2");
    expect(firstScenario.patient.id).toBe(first.variant.patientId);
    expect(firstScenario.activeDispensingFacilityId).toBe(first.variant.establishmentId);
    expect(firstScenario.prescriptions.some(
      (record) => record.lines.some((line) => line.medicationPresentationId === first.variant.presentationId),
    )).toBe(true);
    expect(firstScenario.reinforcementChallengeKey).toBe(first.variant.challengeKey);

    const firstMemory = buildRecentVariantMemory(
      withPreparationFailure(createSimulationSession(firstScenario)),
      "preparation-comparison",
    );
    expect(firstMemory.windowSize).toBe(3);
    expect(firstMemory.entries[0]?.scenarioId).toBe(firstScenario.id);
    expect(firstMemory.entries[0]?.drawerId).toBe(first.variant.drawerId);

    const second = recommendReinforcement(withPreparationFailure(createSimulationSession(firstScenario)));
    expect(second).not.toBeNull();
    if (!second) return;
    expectDifferentVariant(second.variant, first.variant);
    expectDifferentImmediateContext(second.variant, first.variant);

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
    expectDifferentImmediateContext(third.variant, second.variant);
  });

  it("routes attention/prescription reinforcement to TENS 1", () => {
    const baseScenario = generateScenarioDefinition({ id: "identity-base", mode: "practice", seed: 77 });
    const baseSession = createSimulationSession(baseScenario);
    const failed: SimulationSession = {
      ...baseSession,
      criteria: {
        ...baseSession.criteria,
        "criterion-2-system-identity-match": "reinforcement",
      },
    };
    const recommendation = recommendReinforcement(failed);
    expect(recommendation?.targetPlayerRole).toBe("tens-1");
    if (!recommendation) return;
    const scenario = generateScenarioDefinition({
      id: recommendation.scenarioId,
      mode: "practice",
      seed: recommendation.seed,
    });
    expect(scenario.requiredPlayerRole).toBe("tens-1");
  });

  it("builds wrong-strength reinforcement only from real same-medication Atención Abierta presentations", () => {
    const seed = seedForChallenge("preparation-wrong-strength");
    const variant = reinforcementVariantForSeed(seed, "preparation-comparison");
    const id = `reinforcement__preparation-comparison__${seed.toString(36)}__`;
    const scenario = generateScenarioDefinition({ id, mode: "practice", seed });
    const challengeDrawer = scenario.drawers.find((drawer) => drawer.id.startsWith(variant.drawerId));
    expect(challengeDrawer).toBeDefined();
    const presentations = (challengeDrawer?.contents ?? []).map((presentationId) =>
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
    const variant = reinforcementVariantForSeed(seed, "preparation-comparison");
    const id = `reinforcement__preparation-comparison__${seed.toString(36)}__`;
    const scenario = generateScenarioDefinition({ id, mode: "practice", seed });
    const challengeDrawer = scenario.drawers.find((drawer) => drawer.id.startsWith(variant.drawerId));
    expect(challengeDrawer).toBeDefined();
    const presentations = (challengeDrawer?.contents ?? []).map((presentationId) =>
      scenario.arsenal.find((item) => item.id === presentationId),
    );

    expect(presentations).toHaveLength(2);
    expect(presentations[0]?.medicationId).not.toBe(presentations[1]?.medicationId);
    expect(evaluateStorage(scenario).map((item) => item.kind)).toContain("mixed-product");
  });
});
