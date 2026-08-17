import { evaluateSimulation } from "@/features/simulation-engine/engine";
import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";
import { validateScenarioSession } from "@/features/simulation-engine/scenario-validator";

export function buildMinimumScenarioReport() {
  return minimumScenarioFixtures.map((fixture) => {
    const validation = validateScenarioSession(fixture.definition, fixture.session);
    const evaluation = validation.valid
      ? evaluateSimulation(fixture.definition, fixture.session, fixture.events)
      : null;

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
    };
  });
}
