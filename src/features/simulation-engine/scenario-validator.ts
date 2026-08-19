import type { ScenarioDefinition } from "./types";

export type ScenarioValidationResult = {
  valid: boolean;
  issues: string[];
};

function duplicates(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

export function validateScenarioDefinition(
  scenario: ScenarioDefinition,
): ScenarioValidationResult {
  const issues: string[] = [];
  const patientIds = new Set([scenario.patient.id, ...scenario.similarPatients.map((p) => p.id)]);
  const actorIds = new Set(scenario.actors.map((actor) => actor.id));
  const prescriptionIds = new Set(scenario.prescriptions.map((record) => record.id));
  const presentationIds = new Set(scenario.arsenal.map((presentation) => presentation.id));
  const lineIds = new Set(scenario.prescriptions.flatMap((record) => record.lines.map((line) => line.id)));

  for (const id of duplicates(scenario.actors.map((actor) => actor.id))) {
    issues.push(`Duplicate actor id: ${id}`);
  }
  for (const id of duplicates(scenario.prescriptions.map((record) => record.id))) {
    issues.push(`Duplicate prescription id: ${id}`);
  }
  for (const id of duplicates(scenario.arsenal.map((presentation) => presentation.id))) {
    issues.push(`Duplicate medication presentation id: ${id}`);
  }
  for (const id of duplicates(scenario.prescriptions.flatMap((record) => record.lines.map((line) => line.id)))) {
    issues.push(`Duplicate prescription line id: ${id}`);
  }
  if (!actorIds.size) issues.push("Scenario requires at least one actor");
  if (!scenario.actors.some((actor) => actor.controller === "participant")) {
    issues.push("Scenario requires a participant-controlled actor");
  }

  for (const record of scenario.prescriptions) {
    if (!patientIds.has(record.patientId)) {
      issues.push(`Prescription ${record.id} uses an unknown patient: ${record.patientId}`);
    }
    for (const line of record.lines) {
      if (!presentationIds.has(line.medicationPresentationId)) {
        issues.push(
          `Prescription line ${line.id} uses an unknown presentation: ${line.medicationPresentationId}`,
        );
      }
    }
  }

  for (const id of scenario.expectedPrescriptionIds) {
    if (!prescriptionIds.has(id)) issues.push(`Unknown expected prescription: ${id}`);
  }

  const withdrawalEstablishments = new Set(
    scenario.prescriptions
      .filter((record) => scenario.expectedPrescriptionIds.includes(record.id))
      .map((record) => record.establishmentId),
  );
  if (withdrawalEstablishments.size > 1) {
    issues.push("Current withdrawal must belong to a single dispensing establishment");
  }

  for (const drawer of scenario.drawers) {
    if (!presentationIds.has(drawer.expectedMedicationPresentationId)) {
      issues.push(`Drawer ${drawer.id} expects an unknown presentation`);
    }
    for (const id of drawer.contents) {
      if (!presentationIds.has(id)) issues.push(`Drawer ${drawer.id} contains an unknown presentation: ${id}`);
    }
  }
  for (const item of scenario.initialTray.items) {
    if (!presentationIds.has(item.medicationPresentationId)) {
      issues.push(`Tray item ${item.id} uses an unknown presentation`);
    }
    if (item.prescriptionLineId && !lineIds.has(item.prescriptionLineId)) {
      issues.push(`Tray item ${item.id} uses an unknown prescription line`);
    }
  }
  if (scenario.initialTray.patientId !== scenario.patient.id) {
    issues.push("Initial tray patient must match the scenario patient");
  }

  return { valid: issues.length === 0, issues };
}

export function assertValidScenarioDefinition(scenario: ScenarioDefinition) {
  const result = validateScenarioDefinition(scenario);
  if (!result.valid) {
    throw new Error(`Invalid scenario ${scenario.id}:\n${result.issues.join("\n")}`);
  }
  return scenario;
}
