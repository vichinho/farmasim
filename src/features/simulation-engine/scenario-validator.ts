import { deriveSimulationState } from "@/features/simulation-engine/state";
import { deriveDeliveryDiscrepancies } from "@/features/simulation-engine/safety-engine";
import type {
  ScenarioDefinition,
  ScenarioValidationIssue,
  ScenarioValidationResult,
  SimulationSession,
} from "@/features/simulation-engine/types";

function countConfiguredStorageDeviations(session: SimulationSession): number {
  return session.drawers.reduce((count, drawer) => {
    let next = count;

    if (drawer.displayedLabel !== drawer.expectedLabel) next += 1;

    if (
      drawer.expectedMedicationPresentationId &&
      drawer.contents.some((item) => item.presentationId !== drawer.expectedMedicationPresentationId)
    ) {
      next += 1;
    }

    if (drawer.physicalCondition !== "good") next += 1;
    if (drawer.stockState === "out-of-stock") next += 1;

    return next;
  }, 0);
}

export function validateScenarioSession(
  definition: ScenarioDefinition,
  session: SimulationSession,
): ScenarioValidationResult {
  const issues: ScenarioValidationIssue[] = [];
  const patientIds = new Set(session.patients.map((patient) => patient.id));
  const facilityIds = new Set(session.facilities.map((facility) => facility.id));
  const presentationIds = new Set(session.presentations.map((presentation) => presentation.id));
  const prescriptionIds = new Set(session.prescriptions.map((prescription) => prescription.id));
  const actorIds = new Set(session.actors.map((actor) => actor.id));

  if (session.scenarioDefinitionId !== definition.id || session.scenarioDefinitionVersion !== definition.version) {
    issues.push({ code: "scenario-version-mismatch", message: "La sesión no coincide con la definición/version del escenario." });
  }

  if (!definition.allowedRoles.includes(session.playerRole)) {
    issues.push({ code: "role-not-allowed", message: `El rol ${session.playerRole} no está permitido por el escenario.` });
  }

  if (!definition.allowedModes.includes(session.mode)) {
    issues.push({ code: "mode-not-allowed", message: `El modo ${session.mode} no está permitido por el escenario.` });
  }

  if (!patientIds.has(session.patientId)) {
    issues.push({ code: "patient-missing", message: "El paciente objetivo no existe en la sesión." });
  }

  for (const record of session.records) {
    if (!patientIds.has(record.patientId)) {
      issues.push({ code: "record-patient-missing", message: `Registro ${record.id} referencia un paciente inexistente.` });
    }
    if (!facilityIds.has(record.facilityId)) {
      issues.push({ code: "record-facility-missing", message: `Registro ${record.id} referencia un establecimiento inexistente.` });
    }
    for (const prescriptionId of record.prescriptionIds) {
      if (!prescriptionIds.has(prescriptionId)) {
        issues.push({ code: "record-prescription-missing", message: `Registro ${record.id} referencia la prescripción inexistente ${prescriptionId}.` });
      }
    }
  }

  for (const prescription of session.prescriptions) {
    if (!presentationIds.has(prescription.presentationId)) {
      issues.push({ code: "prescription-presentation-missing", message: `Prescripción ${prescription.id} referencia una presentación inexistente.` });
    }
    if (!facilityIds.has(prescription.facilityId)) {
      issues.push({ code: "prescription-facility-missing", message: `Prescripción ${prescription.id} referencia un establecimiento inexistente.` });
    }
  }

  for (const drawer of session.drawers) {
    if (drawer.expectedMedicationPresentationId && !presentationIds.has(drawer.expectedMedicationPresentationId)) {
      issues.push({ code: "drawer-expected-presentation-missing", message: `Gaveta ${drawer.id} referencia una presentación esperada inexistente.` });
    }
    for (const content of drawer.contents) {
      if (!presentationIds.has(content.presentationId)) {
        issues.push({ code: "drawer-content-presentation-missing", message: `Contenido ${content.id} de ${drawer.id} referencia una presentación inexistente.` });
      }
    }
  }

  for (const item of [...session.preparation.requestedItems, ...session.preparation.preparedItems]) {
    if (!presentationIds.has(item.presentationId)) {
      issues.push({ code: "preparation-presentation-missing", message: `La preparación referencia la presentación inexistente ${item.presentationId}.` });
    }
    if (item.quantity <= 0) {
      issues.push({ code: "invalid-preparation-quantity", message: `Cantidad inválida para ${item.presentationId}.` });
    }
  }

  if (!actorIds.has(session.preparation.preparedBy)) {
    issues.push({ code: "preparation-actor-missing", message: "El actor que preparó la bandeja no existe en la sesión." });
  }

  const initialState = deriveSimulationState(session, []);
  const materialDiscrepancyCount = deriveDeliveryDiscrepancies(session, initialState).length;
  const storageDeviationCount = countConfiguredStorageDeviations(session);
  const configuredErrorCount = materialDiscrepancyCount + storageDeviationCount;

  if (configuredErrorCount < definition.errorCountRange.min || configuredErrorCount > definition.errorCountRange.max) {
    issues.push({
      code: "error-count-out-of-range",
      message: `La sesión contiene ${configuredErrorCount} discrepancias/desviaciones configuradas y el escenario permite ${definition.errorCountRange.min}-${definition.errorCountRange.max}.`,
    });
  }

  return { valid: issues.length === 0, issues };
}
