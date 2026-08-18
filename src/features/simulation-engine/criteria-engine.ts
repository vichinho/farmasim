import { eventValues, hasEvent } from "./event-log";
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

export function evaluateCriteria(
  scenario: ScenarioDefinition,
  events: SimulationEvent[],
): Record<DispensingCriterionId, CriterionStatus> {
  const result = emptyCriteria();
  const opened = new Set(eventValues(events, "prescription.opened", "prescriptionId"));
  const verified = new Set(
    eventValues(events, "prescription.status_verified", "prescriptionId"),
  );
  const allOpened = scenario.expectedPrescriptionIds.every((id) => opened.has(id));
  const allVerified = scenario.expectedPrescriptionIds.every((id) => verified.has(id));

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
  if (allOpened) result["criterion-3-identify-all-prescriptions"] = "met";
  if (allVerified) result["criterion-4-confirm-prescription-issued"] = "met";

  if (hasEvent(events, "correction.requested")) {
    result["criterion-5-compare-prepared-items"] = "intercepted";
  } else if (hasEvent(events, "delivery.completed")) {
    result["criterion-5-compare-prepared-items"] = "met";
  } else if (hasEvent(events, "delivery.blocked")) {
    result["criterion-5-compare-prepared-items"] = "reinforcement";
  }

  if (hasEvent(events, "identity.rechecked")) {
    result["criterion-6-recheck-identity-before-handoff"] = "met";
  }
  if (hasEvent(events, "instructions.given")) {
    result["criterion-7-provide-corresponding-instructions"] = "met";
  }

  return result;
}
