import type {
  MedicationPresentation,
  PrescriptionLine,
  SafetyDiscrepancy,
  ScenarioDefinition,
  SimulationSession,
  TrayItem,
} from "./types";

function presentationById(scenario: ScenarioDefinition, id: string) {
  return scenario.arsenal.find((presentation) => presentation.id === id);
}

export function expectedPrescriptionLines(scenario: ScenarioDefinition) {
  const expectedIds = new Set(scenario.prescriptionsRelevantToCurrentWithdrawal);
  return scenario.prescriptions
    .filter((record) => expectedIds.has(record.id))
    .flatMap((record) => record.lines);
}

export function buildExpectedTray(scenario: ScenarioDefinition) {
  return {
    ...scenario.initialTray,
    patientId: scenario.patient.id,
    status: "corrected" as const,
    items: expectedPrescriptionLines(scenario).map((line) => ({
      id: `expected:${line.id}`,
      prescriptionLineId: line.id,
      medicationPresentationId: line.medicationPresentationId,
      quantity: line.quantity,
    })),
  };
}

function comparePresentation(
  expectedLine: PrescriptionLine,
  expected: MedicationPresentation,
  actualItem: TrayItem,
  actual: MedicationPresentation,
): SafetyDiscrepancy[] {
  const base = { prescriptionLineId: expectedLine.id, trayItemId: actualItem.id };
  const discrepancies: SafetyDiscrepancy[] = [];

  if (expected.medicationId !== actual.medicationId) {
    discrepancies.push({
      ...base,
      id: `medication:${expectedLine.id}`,
      kind: "medication",
      expected: expected.medicationName,
      actual: actual.medicationName,
    });
  }
  if (expected.strength !== actual.strength) {
    discrepancies.push({
      ...base,
      id: `strength:${expectedLine.id}`,
      kind: "strength",
      expected: expected.strength,
      actual: actual.strength,
    });
  }
  if (expected.pharmaceuticalForm !== actual.pharmaceuticalForm) {
    discrepancies.push({
      ...base,
      id: `form:${expectedLine.id}`,
      kind: "pharmaceutical-form",
      expected: expected.pharmaceuticalForm,
      actual: actual.pharmaceuticalForm,
    });
  }
  if (expectedLine.quantity !== actualItem.quantity) {
    discrepancies.push({
      ...base,
      id: `quantity:${expectedLine.id}`,
      kind: "quantity",
      expected: String(expectedLine.quantity),
      actual: String(actualItem.quantity),
    });
  }

  return discrepancies;
}

export function evaluateDeliverySafety(
  scenario: ScenarioDefinition,
  session: SimulationSession,
): SafetyDiscrepancy[] {
  const discrepancies: SafetyDiscrepancy[] = [];

  if (session.loadedPatientId !== scenario.patient.id || session.tray.patientId !== scenario.patient.id) {
    discrepancies.push({
      id: "patient:delivery",
      kind: "patient",
      expected: scenario.patient.id,
      actual: session.loadedPatientId ?? session.tray.patientId,
    });
  }

  for (const prescriptionId of scenario.prescriptionsRelevantToCurrentWithdrawal) {
    if (!session.verifiedPrescriptionIds.includes(prescriptionId)) {
      discrepancies.push({
        id: `prescription:${prescriptionId}`,
        kind: "prescription",
        expected: `${prescriptionId}:verified`,
        actual: `${prescriptionId}:not-verified`,
      });
    }
  }

  const expected = expectedPrescriptionLines(scenario);
  const trayItemsByLine = new Map(
    session.tray.items
      .filter((item) => item.prescriptionLineId)
      .map((item) => [item.prescriptionLineId as string, item]),
  );

  for (const line of expected) {
    const item = trayItemsByLine.get(line.id);
    if (!item) {
      discrepancies.push({
        id: `omission:${line.id}`,
        kind: "omission",
        expected: line.medicationPresentationId,
        actual: "missing",
        prescriptionLineId: line.id,
      });
      continue;
    }

    const expectedPresentation = presentationById(scenario, line.medicationPresentationId);
    const actualPresentation = presentationById(scenario, item.medicationPresentationId);
    if (!expectedPresentation || !actualPresentation) {
      discrepancies.push({
        id: `prescription:${line.id}`,
        kind: "prescription",
        expected: line.medicationPresentationId,
        actual: item.medicationPresentationId,
        prescriptionLineId: line.id,
        trayItemId: item.id,
      });
      continue;
    }

    discrepancies.push(...comparePresentation(line, expectedPresentation, item, actualPresentation));
  }

  const expectedLineIds = new Set(expected.map((line) => line.id));
  for (const item of session.tray.items) {
    if (!item.prescriptionLineId || !expectedLineIds.has(item.prescriptionLineId)) {
      discrepancies.push({
        id: `additional:${item.id}`,
        kind: "additional-product",
        expected: "none",
        actual: item.medicationPresentationId,
        trayItemId: item.id,
      });
    }
  }

  return discrepancies;
}
