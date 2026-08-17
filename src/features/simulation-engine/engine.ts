import { deriveProcessDeviations, evaluateCompetencies, evaluateProcessCriteria } from "@/features/simulation-engine/evaluation";
import { evaluateDeliverySafety } from "@/features/simulation-engine/safety-engine";
import { validateScenarioSession } from "@/features/simulation-engine/scenario-validator";
import { deriveSimulationState } from "@/features/simulation-engine/state";
import type {
  ProcessDeviation,
  ScenarioDefinition,
  SimulationEvaluation,
  SimulationEvent,
  SimulationSession,
} from "@/features/simulation-engine/types";

function deriveStorageDeviations(
  session: SimulationSession,
  events: readonly SimulationEvent[],
): ProcessDeviation[] {
  const inspectedDrawerIds = new Set(
    events
      .filter((event) =>
        event.type === "drawer.label_inspected" || event.type === "drawer.contents_inspected",
      )
      .map((event) => event.targetId)
      .filter((id): id is string => typeof id === "string"),
  );

  const deviations: ProcessDeviation[] = [];

  for (const drawer of session.drawers) {
    if (!inspectedDrawerIds.has(drawer.id)) continue;

    if (drawer.displayedLabel !== drawer.expectedLabel) {
      deviations.push({
        id: `deviation:${drawer.id}:label`,
        type: "drawer_label_mismatch",
        stage: "storage",
        evidenceEventIds: events
          .filter((event) => event.targetId === drawer.id && event.type === "drawer.label_inspected")
          .map((event) => event.id),
      });
    }

    if (
      drawer.expectedMedicationPresentationId &&
      drawer.contents.some((item) => item.presentationId !== drawer.expectedMedicationPresentationId)
    ) {
      deviations.push({
        id: `deviation:${drawer.id}:mixed-contents`,
        type: "drawer_mixed_contents",
        stage: "storage",
        evidenceEventIds: events
          .filter((event) => event.targetId === drawer.id && event.type === "drawer.contents_inspected")
          .map((event) => event.id),
      });
    }
  }

  return deviations;
}

export function evaluateSimulation(
  definition: ScenarioDefinition,
  session: SimulationSession,
  events: readonly SimulationEvent[],
): SimulationEvaluation {
  const validation = validateScenarioSession(definition, session);
  if (!validation.valid) {
    throw new Error(
      `Invalid simulation session: ${validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join(" | ")}`,
    );
  }

  const state = deriveSimulationState(session, events);
  const safety = evaluateDeliverySafety(session, state, events);
  const criteria = evaluateProcessCriteria(definition, session, state, events, safety.discrepancies);
  const competencies = evaluateCompetencies(session, state, events, safety.discrepancies);
  const processDeviations = [
    ...deriveProcessDeviations(criteria),
    ...deriveStorageDeviations(session, events),
  ];

  return { state, criteria, competencies, processDeviations, safety };
}
