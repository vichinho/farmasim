import type { DispensingCriterionId } from "@/types/training-simulation";
import type {
  CompetencyId,
  CompetencyResult,
  MedicationDiscrepancy,
  MedicationDiscrepancyType,
  ProcessCriterionResult,
  ProcessDeviation,
  ScenarioDefinition,
  SimulationEvent,
  SimulationSession,
  SimulationState,
} from "@/features/simulation-engine/types";

const DISPENSING_CRITERIA: DispensingCriterionId[] = [
  "criterion-1-request-identity-document",
  "criterion-2-system-identity-match",
  "criterion-3-identify-all-prescriptions",
  "criterion-4-confirm-prescription-issued",
  "criterion-5-compare-prepared-items",
  "criterion-6-recheck-identity-before-handoff",
  "criterion-7-provide-corresponding-instructions",
];

function eventIds(events: readonly SimulationEvent[], type: SimulationEvent["type"]): string[] {
  return events.filter((event) => event.type === type).map((event) => event.id);
}

function result(
  criterionId: DispensingCriterionId,
  status: ProcessCriterionResult["status"],
  evidenceEventIds: string[],
): ProcessCriterionResult {
  return { criterionId, status, evidenceEventIds };
}

function hasDiscrepancy(
  discrepancies: readonly MedicationDiscrepancy[],
  ...types: MedicationDiscrepancyType[]
): boolean {
  return discrepancies.some((discrepancy) => types.includes(discrepancy.type));
}

export function evaluateProcessCriteria(
  definition: ScenarioDefinition,
  session: SimulationSession,
  state: SimulationState,
  events: readonly SimulationEvent[],
  discrepancies: readonly MedicationDiscrepancy[],
): ProcessCriterionResult[] {
  if (session.playerRole === "preparation") {
    return DISPENSING_CRITERIA.map((criterionId) => result(criterionId, "not-applicable", []));
  }

  const documentRequested = eventIds(events, "document.requested");
  const documentOpened = eventIds(events, "document.opened");
  const rutTyped = eventIds(events, "rut.typed");
  const searches = eventIds(events, "search.executed");
  const recordOpened = eventIds(events, "patient_record.opened");
  const identityRechecked = eventIds(events, "identity.rechecked");
  const instructionsGiven = eventIds(events, "instructions.given");
  const trayInspected = eventIds(events, "tray.inspected");
  const medicationInspected = eventIds(events, "medication.inspected");

  const relevantPrescriptions = session.prescriptions.filter(
    (prescription) => prescription.relevantForCurrentWithdrawal,
  );
  const allRelevantOpened = relevantPrescriptions.every((prescription) =>
    state.openedPrescriptionIds.includes(prescription.id),
  );

  const continuableStatuses = definition.protocolRules?.continuablePrescriptionStatuses;
  const statusCriterion = !continuableStatuses
    ? "requires-review"
    : relevantPrescriptions.every((prescription) => continuableStatuses.includes(prescription.status))
      ? "met"
      : "missed";

  const inspectedPreparedPresentations = new Set(
    events
      .filter((event) => event.type === "medication.inspected" && event.targetId)
      .map((event) => event.targetId as string),
  );
  const allPreparedItemsInspected = session.preparation.preparedItems.every((item) =>
    inspectedPreparedPresentations.has(item.presentationId),
  );
  const comparisonPerformed = trayInspected.length > 0 && allPreparedItemsInspected;
  const unresolvedPreparationMismatch = discrepancies.some(
    (discrepancy) => discrepancy.originStage === "preparation",
  );

  return [
    result(
      "criterion-1-request-identity-document",
      documentRequested.length > 0 ? "met" : "missed",
      documentRequested,
    ),
    result(
      "criterion-2-system-identity-match",
      documentOpened.length > 0 && rutTyped.length > 0 && searches.length > 0 && state.activePatientId === session.patientId
        ? "met"
        : "missed",
      [...documentOpened, ...rutTyped, ...searches, ...recordOpened],
    ),
    result(
      "criterion-3-identify-all-prescriptions",
      allRelevantOpened ? "met" : "missed",
      events.filter((event) => event.type === "prescription.opened").map((event) => event.id),
    ),
    result(
      "criterion-4-confirm-prescription-issued",
      statusCriterion,
      events.filter((event) => event.type === "prescription.opened").map((event) => event.id),
    ),
    result(
      "criterion-5-compare-prepared-items",
      comparisonPerformed && !unresolvedPreparationMismatch ? "met" : "missed",
      [...trayInspected, ...medicationInspected],
    ),
    result(
      "criterion-6-recheck-identity-before-handoff",
      identityRechecked.length > 0 ? "met" : "missed",
      identityRechecked,
    ),
    result(
      "criterion-7-provide-corresponding-instructions",
      instructionsGiven.length > 0 ? "met" : "missed",
      instructionsGiven,
    ),
  ];
}

export function evaluateCompetencies(
  session: SimulationSession,
  state: SimulationState,
  events: readonly SimulationEvent[],
  discrepancies: readonly MedicationDiscrepancy[],
): CompetencyResult[] {
  const byType = (type: SimulationEvent["type"]) => eventIds(events, type);
  const relevantPrescriptions = session.prescriptions.filter((item) => item.relevantForCurrentWithdrawal);
  const allRelevantOpened = relevantPrescriptions.every((item) => state.openedPrescriptionIds.includes(item.id));
  const inspectedEvents = events.filter((event) => event.type === "medication.inspected");
  const inspectedPresentationIds = new Set(
    inspectedEvents.map((event) => event.targetId).filter((id): id is string => typeof id === "string"),
  );
  const allPreparedInspected = session.preparation.preparedItems.every((item) =>
    inspectedPresentationIds.has(item.presentationId),
  );
  const isPreparationRole = session.playerRole === "preparation";
  const preparationInspectionPerformed = inspectedEvents.length > 0;
  const attentionInspectionPerformed = state.trayInspected && allPreparedInspected;
  const verificationWasPerformed = isPreparationRole
    ? preparationInspectionPerformed
    : attentionInspectionPerformed;

  const results: Record<CompetencyId, CompetencyResult> = {
    identity_verification: {
      competencyId: "identity_verification",
      status: isPreparationRole
        ? "not-observed"
        : byType("document.opened").length > 0 && byType("rut.typed").length > 0 && state.activePatientId === session.patientId
          ? "met"
          : "missed",
      evidenceEventIds: [...byType("document.opened"), ...byType("rut.typed"), ...byType("patient_record.opened")],
    },
    record_review: {
      competencyId: "record_review",
      status: isPreparationRole ? "not-observed" : allRelevantOpened ? "met" : "missed",
      evidenceEventIds: byType("prescription.opened"),
    },
    verify_medication: {
      competencyId: "verify_medication",
      status:
        verificationWasPerformed && !hasDiscrepancy(discrepancies, "wrong_medication", "omission", "extra_product")
          ? "met"
          : "missed",
      evidenceEventIds: [...byType("tray.inspected"), ...byType("medication.inspected")],
    },
    verify_strength: {
      competencyId: "verify_strength",
      status: verificationWasPerformed && !hasDiscrepancy(discrepancies, "wrong_strength") ? "met" : "missed",
      evidenceEventIds: inspectedEvents.map((event) => event.id),
    },
    verify_form: {
      competencyId: "verify_form",
      status: verificationWasPerformed && !hasDiscrepancy(discrepancies, "wrong_form") ? "met" : "missed",
      evidenceEventIds: inspectedEvents.map((event) => event.id),
    },
    verify_quantity: {
      competencyId: "verify_quantity",
      status: verificationWasPerformed && !hasDiscrepancy(discrepancies, "wrong_quantity") ? "met" : "missed",
      evidenceEventIds: inspectedEvents.map((event) => event.id),
    },
    storage_check: {
      competencyId: "storage_check",
      status: byType("drawer.contents_inspected").length > 0 ? "met" : "not-observed",
      evidenceEventIds: [...byType("drawer.label_inspected"), ...byType("drawer.contents_inspected")],
    },
    double_check_performed: {
      competencyId: "double_check_performed",
      status: isPreparationRole
        ? "not-observed"
        : attentionInspectionPerformed ? "met" : "missed",
      evidenceEventIds: [...byType("tray.inspected"), ...byType("medication.inspected")],
    },
    instructions: {
      competencyId: "instructions",
      status: isPreparationRole ? "not-observed" : byType("instructions.given").length > 0 ? "met" : "missed",
      evidenceEventIds: byType("instructions.given"),
    },
    qf_escalation: {
      competencyId: "qf_escalation",
      status: state.qfSupportRequested ? "met" : "not-observed",
      evidenceEventIds: byType("qf_support.requested"),
    },
  };

  return Object.values(results);
}

export function deriveProcessDeviations(criteria: ProcessCriterionResult[]): ProcessDeviation[] {
  return criteria
    .filter((criterion) => criterion.status === "missed")
    .map((criterion) => ({
      id: `deviation:${criterion.criterionId}`,
      type: "process_criterion_missed",
      stage: criterion.criterionId,
      evidenceEventIds: criterion.evidenceEventIds,
    }));
}
