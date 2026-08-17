import type {
  CompetencyId,
  ScenarioDefinition,
  SimulationSession,
} from "@/features/simulation-engine/types";

export type ReinforcementHistory = {
  scenarioDefinitionIds: string[];
  patientIds: string[];
  medicationIds: string[];
  presentationIds: string[];
  facilityIds: string[];
};

export type ReinforcementCandidate = {
  definition: ScenarioDefinition;
  session: SimulationSession;
};

export type ReinforcementRecommendation = {
  scenarioDefinitionId: string;
  sessionId: string;
  targetedCompetencies: CompetencyId[];
  score: number;
};

function sessionMedicationIds(session: SimulationSession): Set<string> {
  const requestedIds = new Set(session.preparation.requestedItems.map((item) => item.presentationId));
  return new Set(
    session.presentations
      .filter((presentation) => requestedIds.has(presentation.id))
      .map((presentation) => presentation.medicationId),
  );
}

export function selectReinforcement(
  failedCompetencies: CompetencyId[],
  candidates: ReinforcementCandidate[],
  history: ReinforcementHistory,
): ReinforcementRecommendation | null {
  if (failedCompetencies.length === 0) return null;

  const recentScenarioIds = new Set(history.scenarioDefinitionIds);
  const recentPatientIds = new Set(history.patientIds);
  const recentMedicationIds = new Set(history.medicationIds);
  const recentPresentationIds = new Set(history.presentationIds);
  const recentFacilityIds = new Set(history.facilityIds);

  const ranked = candidates
    .map((candidate) => {
      const targetedCompetencies = candidate.definition.competencyTargets.filter((competency) =>
        failedCompetencies.includes(competency),
      );
      if (targetedCompetencies.length === 0) return null;

      let score = targetedCompetencies.length * 100;
      if (recentScenarioIds.has(candidate.definition.id)) score -= 30;
      if (recentPatientIds.has(candidate.session.patientId)) score -= 15;

      const medications = sessionMedicationIds(candidate.session);
      if ([...medications].some((id) => recentMedicationIds.has(id))) score -= 12;
      if (candidate.session.preparation.requestedItems.some((item) => recentPresentationIds.has(item.presentationId))) score -= 10;
      if (candidate.session.prescriptions.some((prescription) => recentFacilityIds.has(prescription.facilityId))) score -= 6;

      return {
        scenarioDefinitionId: candidate.definition.id,
        sessionId: candidate.session.id,
        targetedCompetencies,
        score,
      } satisfies ReinforcementRecommendation;
    })
    .filter((item): item is ReinforcementRecommendation => item !== null)
    .sort((a, b) => b.score - a.score || a.scenarioDefinitionId.localeCompare(b.scenarioDefinitionId));

  return ranked[0] ?? null;
}
