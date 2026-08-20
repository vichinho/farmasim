import type { Json } from "@/types/database";

export type CompetencyId =
  | "patient-identification"
  | "prescription-review"
  | "preparation-comparison"
  | "final-identification"
  | "instructions";

export type CompetencyTrainingStatus = "dominated" | "in-progress" | "reinforcement" | "not-started";

export const competencyLabels: Record<CompetencyId, string> = {
  "patient-identification": "Identificación del paciente",
  "prescription-review": "Revisión de prescripciones",
  "preparation-comparison": "Preparación y comparación",
  "final-identification": "Reidentificación final",
  instructions: "Indicaciones al paciente",
};

const competencyCriteria: Record<CompetencyId, string[]> = {
  "patient-identification": [
    "criterion-1-request-identity-document",
    "criterion-2-system-identity-match",
  ],
  "prescription-review": [
    "criterion-3-identify-all-prescriptions",
    "criterion-4-confirm-prescription-issued",
  ],
  "preparation-comparison": ["criterion-5-compare-prepared-items"],
  "final-identification": ["criterion-6-recheck-identity-before-handoff"],
  instructions: ["criterion-7-provide-corresponding-instructions"],
};

export type AttemptCompetencySource = {
  completedAt: string | null;
  criterionResults: Json;
};

type CriterionSnapshot = {
  criterionId: string;
  status: "met" | "intercepted" | "reinforcement";
};

function parseCriterionResults(value: Json): CriterionSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || Array.isArray(entry) || typeof entry !== "object") return [];
    const criterionId = entry.criterionId;
    const status = entry.status;
    if (
      typeof criterionId !== "string"
      || (status !== "met" && status !== "intercepted" && status !== "reinforcement")
    ) return [];
    return [{ criterionId, status }];
  });
}

function competencyEvidence(attempt: AttemptCompetencySource, competency: CompetencyId) {
  const expectedCriteria = competencyCriteria[competency];
  const byId = new Map(parseCriterionResults(attempt.criterionResults).map((item) => [item.criterionId, item.status]));
  const statuses = expectedCriteria.flatMap((criterionId) => {
    const status = byId.get(criterionId);
    return status ? [status] : [];
  });
  if (!statuses.length) return null;
  return {
    successful: expectedCriteria.every((criterionId) => {
      const status = byId.get(criterionId);
      return status === "met" || status === "intercepted";
    }),
    reinforcement: statuses.includes("reinforcement"),
  };
}

export function competencyTrainingStatus(
  attempts: AttemptCompetencySource[],
  competency: CompetencyId,
): CompetencyTrainingStatus {
  const evidence = attempts
    .filter((attempt) => attempt.completedAt)
    .toSorted((left, right) => Date.parse(right.completedAt ?? "") - Date.parse(left.completedAt ?? ""))
    .flatMap((attempt) => {
      const item = competencyEvidence(attempt, competency);
      return item ? [item] : [];
    });

  if (!evidence.length) return "not-started";
  if (evidence[0].reinforcement) return "reinforcement";
  if (evidence[0].successful && evidence[1]?.successful) return "dominated";
  return "in-progress";
}

export function summarizeCompetencies(attempts: AttemptCompetencySource[]) {
  return (Object.keys(competencyLabels) as CompetencyId[]).map((competency) => ({
    id: competency,
    label: competencyLabels[competency],
    status: competencyTrainingStatus(attempts, competency),
  }));
}
