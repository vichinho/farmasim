import type { DispensingCriterionId } from "@/types/training-simulation";
import type { SimulationSession } from "./types";

export type ReinforcementCompetency =
  | "patient-identification"
  | "prescription-review"
  | "preparation-comparison"
  | "final-identification"
  | "instructions";

export type ReinforcementRecommendation = {
  competency: ReinforcementCompetency;
  failedCriterionIds: DispensingCriterionId[];
  scenarioId: string;
  seed: number;
};

const competencyByCriterion: Record<DispensingCriterionId, ReinforcementCompetency> = {
  "criterion-1-request-identity-document": "patient-identification",
  "criterion-2-system-identity-match": "patient-identification",
  "criterion-3-identify-all-prescriptions": "prescription-review",
  "criterion-4-confirm-prescription-issued": "prescription-review",
  "criterion-5-compare-prepared-items": "preparation-comparison",
  "criterion-6-recheck-identity-before-handoff": "final-identification",
  "criterion-7-provide-corresponding-instructions": "instructions",
};

function nextSeed(seed: number) {
  return (Math.imul(seed ^ 0x9e3779b9, 1664525) + 1013904223) >>> 0;
}
export function recommendReinforcement(
  session: SimulationSession,
  recentScenarioIds: string[] = [],
): ReinforcementRecommendation | null {
  const failedCriterionIds = Object.entries(session.criteria)
    .filter(([, status]) => status === "reinforcement")
    .map(([criterionId]) => criterionId as DispensingCriterionId);
  if (!failedCriterionIds.length) return null;

  const grouped = failedCriterionIds.reduce(
    (counts, criterionId) => {
      const competency = competencyByCriterion[criterionId];
      counts.set(competency, (counts.get(competency) ?? 0) + 1);
      return counts;
    },
    new Map<ReinforcementCompetency, number>(),
  );
  const competency = [...grouped.entries()].sort((left, right) => right[1] - left[1])[0][0];
  let seed = nextSeed(session.seed);
  let scenarioId = `reinforcement-${competency}-${seed.toString(36)}`;
  while (recentScenarioIds.includes(scenarioId) || scenarioId === session.scenarioId) {
    seed = nextSeed(seed);
    scenarioId = `reinforcement-${competency}-${seed.toString(36)}`;
  }

  return { competency, failedCriterionIds, scenarioId, seed };
}
