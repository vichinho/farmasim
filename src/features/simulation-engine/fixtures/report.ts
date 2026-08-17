import { evaluateSimulation } from "@/features/simulation-engine/engine";
import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";
import { selectReinforcement } from "@/features/simulation-engine/reinforcement-engine";
import { validateScenarioSession } from "@/features/simulation-engine/scenario-validator";

export function buildMinimumScenarioReport() {
  return minimumScenarioFixtures.map((fixture) => {
    const validation = validateScenarioSession(fixture.definition, fixture.session);
    const evaluation = validation.valid
      ? evaluateSimulation(fixture.definition, fixture.session, fixture.events)
      : null;

    const failedCompetencies = evaluation?.competencies
      .filter((item) => item.status === "missed")
      .map((item) => item.competencyId) ?? [];
    const requestedPresentationIds = fixture.session.preparation.requestedItems.map((item) => item.presentationId);
    const requestedMedicationIds = fixture.session.presentations
      .filter((presentation) => requestedPresentationIds.includes(presentation.id))
      .map((presentation) => presentation.medicationId);

    const reinforcement = selectReinforcement(
      failedCompetencies,
      minimumScenarioFixtures
        .filter((candidate) => candidate.id !== fixture.id)
        .map((candidate) => ({ definition: candidate.definition, session: candidate.session })),
      {
        scenarioDefinitionIds: [fixture.definition.id],
        patientIds: [fixture.session.patientId],
        medicationIds: requestedMedicationIds,
        presentationIds: requestedPresentationIds,
        facilityIds: fixture.session.prescriptions.map((prescription) => prescription.facilityId),
      },
    );

    return {
      id: fixture.id,
      title: fixture.title,
      scenarioDefinition: fixture.definition,
      session: {
        id: fixture.session.id,
        schemaVersion: fixture.session.schemaVersion,
        seed: fixture.session.seed,
        mode: fixture.session.mode,
        playerRole: fixture.session.playerRole,
        initialClinicalSystemState: fixture.session.initialClinicalSystemState,
        actors: fixture.session.actors,
      },
      validation,
      events: fixture.events,
      criteria: evaluation?.criteria ?? [],
      competencies: evaluation?.competencies ?? [],
      processDeviations: evaluation?.processDeviations ?? [],
      discrepancies: evaluation?.safety.discrepancies ?? [],
      barriers: evaluation?.safety.evaluatedBarriers ?? [],
      safety: evaluation
        ? {
            allowed: evaluation.safety.allowed,
            blockingDiscrepancyIds: evaluation.safety.blockingDiscrepancyIds,
          }
        : null,
      reinforcement,
    };
  });
}
