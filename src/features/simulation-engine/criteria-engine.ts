import { eventValues, hasEvent } from "./event-log";
import { instructionsComplete } from "./instruction-engine";
import type { CriterionStatus, ScenarioDefinition, SimulationEvent } from "./types";
import type { DispensingCriterionId } from "@/types/training-simulation";

const criterionIds: DispensingCriterionId[] = [
  "criterion-1-request-identity-document",
  "criterion-2-system-identity-match",
  "criterion-3-identify-all-prescriptions",
  "criterion-4-confirm-prescription-issued",
  "criterion-5-compare-prepared-items",
  "criterion-6-recheck-identity-before-handoff",
  "criterion-7-provide-corresponding-instructions",
];

export function emptyCriteria() {
  return Object.fromEntries(
    criterionIds.map((criterionId) => [criterionId, "pending"]),
  ) as Record<DispensingCriterionId, CriterionStatus>;
}

function blockedKinds(events: SimulationEvent[]) {
  return new Set(
    events
      .filter((event) => event.type === "delivery.blocked")
      .flatMap((event) => {
        const kinds = event.data.discrepancyKinds;
        return Array.isArray(kinds) ? kinds : [];
      }),
  );
}

export function evaluateCriteria(
  scenario: ScenarioDefinition,
  events: SimulationEvent[],
): Record<DispensingCriterionId, CriterionStatus> {
  const result = emptyCriteria();
  const opened = new Set(eventValues(events, "prescription.opened", "prescriptionId"));
  const verified = new Set(eventValues(events, "prescription.status_verified", "prescriptionId"));
  const comparedLines = new Set(
    eventValues(events, "medication.compared_to_prescription", "prescriptionLineId"),
  );

  const relevantPrescriptionIds = scenario.prescriptionsRelevantToCurrentWithdrawal;
  const allRelevantOpened = relevantPrescriptionIds.every((id) => opened.has(id));
  const allRelevantVerified = relevantPrescriptionIds.every((id) => verified.has(id));
  const relevantLineIds = scenario.prescriptions
    .filter((record) => relevantPrescriptionIds.includes(record.id))
    .flatMap((record) => record.lines.map((line) => line.id));
  const preparationWasActuallyChecked =
    relevantLineIds.length > 0 && relevantLineIds.every((lineId) => comparedLines.has(lineId));

  if (hasEvent(events, "document.requested")) {
    result["criterion-1-request-identity-document"] = "met";
  }
  if (
    hasEvent(
      events,
      "patient_record.opened",
      (event) => event.data.patientId === scenario.patient.id,
    )
  ) {
    result["criterion-2-system-identity-match"] = "met";
  }
  if (allRelevantOpened) result["criterion-3-identify-all-prescriptions"] = "met";
  if (allRelevantVerified) result["criterion-4-confirm-prescription-issued"] = "met";

  if (preparationWasActuallyChecked) {
    result["criterion-5-compare-prepared-items"] = hasEvent(events, "correction.requested")
      ? "intercepted"
      : "met";
  }

  if (hasEvent(events, "identity.rechecked")) {
    result["criterion-6-recheck-identity-before-handoff"] = "met";
  }

  if (instructionsComplete(scenario, events)) {
    result["criterion-7-provide-corresponding-instructions"] = "met";
  } else if (hasEvent(events, "delivery.completed")) {
    result["criterion-7-provide-corresponding-instructions"] = "reinforcement";
  }

  const kinds = blockedKinds(events);
  if (kinds.has("patient")) {
    result["criterion-2-system-identity-match"] = "reinforcement";
    if (hasEvent(events, "identity.rechecked")) {
      result["criterion-6-recheck-identity-before-handoff"] = "reinforcement";
    }
  }
  if (kinds.has("prescription")) {
    result["criterion-3-identify-all-prescriptions"] = "reinforcement";
    result["criterion-4-confirm-prescription-issued"] = "reinforcement";
  }
  if (["medication", "strength", "pharmaceutical-form", "quantity", "omission", "additional-product"].some((kind) => kinds.has(kind))) {
    result["criterion-5-compare-prepared-items"] = preparationWasActuallyChecked
      ? "intercepted"
      : "reinforcement";
  }

  return result;
}
