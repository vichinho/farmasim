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

  for (const id of duplicates(scenario.actors.map((actor) => actor.id))) issues.push(`Duplicate actor id: ${id}`);
  for (const id of duplicates(scenario.prescriptions.map((record) => record.id))) issues.push(`Duplicate prescription id: ${id}`);
  for (const id of duplicates(scenario.arsenal.map((presentation) => presentation.id))) issues.push(`Duplicate medication presentation id: ${id}`);
  for (const id of duplicates(scenario.prescriptions.flatMap((record) => record.lines.map((line) => line.id)))) issues.push(`Duplicate prescription line id: ${id}`);

  if (!actorIds.size) issues.push("Scenario requires at least one actor");
  if (!scenario.actors.some((actor) => actor.controller === "participant")) issues.push("Scenario requires a participant-controlled actor");
  if (!scenario.actors.some((actor) => actor.id === "tens-1" && actor.role === "attention")) issues.push("Scenario requires TENS 1 as attention actor");
  if (!scenario.actors.some((actor) => actor.id === "tens-2" && actor.role === "preparation")) issues.push("Scenario requires TENS 2 as preparation actor");

  for (const record of scenario.prescriptions) {
    if (!patientIds.has(record.patientId)) issues.push(`Prescription ${record.id} uses an unknown patient: ${record.patientId}`);
    for (const line of record.lines) {
      if (!presentationIds.has(line.medicationPresentationId)) issues.push(`Prescription line ${line.id} uses an unknown presentation: ${line.medicationPresentationId}`);
    }
  }

  const recordGroups = [
    ["visibleClinicalRecordIds", scenario.visibleClinicalRecordIds],
    ["availablePrescriptionIds", scenario.availablePrescriptionIds],
    ["prescriptionsRelevantToCurrentWithdrawal", scenario.prescriptionsRelevantToCurrentWithdrawal],
  ] as const;
  for (const [name, ids] of recordGroups) {
    for (const id of ids) if (!prescriptionIds.has(id)) issues.push(`${name} contains unknown prescription: ${id}`);
    for (const id of duplicates(ids)) issues.push(`${name} contains duplicate prescription: ${id}`);
  }
  for (const id of scenario.availablePrescriptionIds) {
    if (!scenario.visibleClinicalRecordIds.includes(id)) issues.push(`Available prescription ${id} must also be visible`);
  }
  for (const id of scenario.prescriptionsRelevantToCurrentWithdrawal) {
    if (!scenario.availablePrescriptionIds.includes(id)) issues.push(`Current-withdrawal prescription ${id} must also be available`);
  }

  for (const [lineId, quantity] of Object.entries(scenario.suggestedPreparationQuantityByLineId ?? {})) {
    if (!lineIds.has(lineId)) issues.push(`Suggested preparation quantity uses unknown prescription line: ${lineId}`);
    if (!Number.isFinite(quantity) || quantity <= 0) issues.push(`Suggested preparation quantity must be positive for line: ${lineId}`);
  }

  for (const drawer of scenario.drawers) {
    if (!presentationIds.has(drawer.expectedMedicationPresentationId)) issues.push(`Drawer ${drawer.id} expects an unknown presentation`);
    for (const id of drawer.contents) if (!presentationIds.has(id)) issues.push(`Drawer ${drawer.id} contains an unknown presentation: ${id}`);
  }

  for (const item of scenario.initialTray.items) {
    if (!presentationIds.has(item.medicationPresentationId)) issues.push(`Tray item ${item.id} uses an unknown presentation`);
    if (item.prescriptionLineId && !lineIds.has(item.prescriptionLineId)) issues.push(`Tray item ${item.id} uses an unknown prescription line`);
  }
  if (scenario.initialTray.patientId !== scenario.patient.id) issues.push("Initial tray patient must match the scenario patient");
  if (scenario.initialTray.items.length > 0 || scenario.initialTray.status !== "empty") issues.push("Preparation scenarios must start with an empty tray");

  for (const presentation of scenario.arsenal) {
    if (presentation.careSetting && presentation.careSetting !== "atencion-abierta") {
      const used = scenario.prescriptions.some((record) => record.lines.some((line) => line.medicationPresentationId === presentation.id));
      if (used) issues.push(`Ambulatory scenario uses non-Atencion-Abierta presentation: ${presentation.id}`);
    }
  }

  return { valid: issues.length === 0, issues };
}

export function assertValidScenarioDefinition(scenario: ScenarioDefinition) {
  const result = validateScenarioDefinition(scenario);
  if (!result.valid) throw new Error(`Invalid scenario ${scenario.id}:\n${result.issues.join("\n")}`);
  return scenario;
}