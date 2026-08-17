import type { DispensingCriterionId } from "@/types/training-simulation";
import type {
  CompetencyId,
  CompetencyResult,
  ProcessCriterionResult,
  ProcessDeviation,
  ScenarioDefinition,
  SimulationEvent,
  SimulationSession,
  SimulationState,
} from "@/features/simulation-engine/types";

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

export function evaluateProcessCriteria(
  definition: ScenarioDefinition,
  session: SimulationSession,
  state: SimulationState,
  events: readonly SimulationEvent[],
): ProcessCriterionResult[] {
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
      events
        .filter((event) => event.type === "prescription.opened")
        .map((event) => event.id),
    ),
    result(
      "criterion-4-confirm-prescription-issued",
      statusCriterion,
      events
        .filter((event) => event.type === "prescription.opened")
        .map((event) => event.id),
    ),
    result(
      "criterion-5-compare-prepared-items",
      trayInspected.length > 0 && allPreparedItemsInspected ? "met" : "missed",
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

  const results: Record<CompetencyId, CompetencyResult> = {
    identity_verification: {
      competencyId: "identity_verification",
      status:
        byType("document.opened").length > 0 &&
        byType("rut.typed").length > 0 &&
        state.activePatientId === session.patientId
          ? "met"
          : "missed",
      evidenceEventIds: [...byType("document.opened"), ...byType("rut.typed"), ...byType("patient_record.opened")],
    },
    record_review: {
      competencyId: "record_review",
      status: allRelevantOpened ? "met" : "missed",
      evidenceEventIds: byType("prescription.opened"),
    },
    verify_medication: {
      competencyId: "verify_medication",
      status: state.trayInspected && allPreparedInspected ? "met" : "missed",
      evidenceEventIds: [...byType("tray.inspected"), ...byType("medication.inspected")],
    },
    verify_strength: {
      competencyId: "verify_strength",
      status: state.trayInspected && allPreparedInspected ? "met" : "missed",
      evidenceEventIds: inspectedEvents.map((event) => event.id),
    },
    verify_form: {
      competencyId: "verify_form",
      status: state.trayInspected && allPreparedInspected ? "met" : "missed",
      evidenceEventIds: inspectedEvents.map((event) => event.id),
    },
    verify_quantity: {
      competencyId: "verify_quantity",
      status: state.trayInspected && allPreparedInspected ? "met" : "missed",
      evidenceEventIds: inspectedEvents.map((event) => event.id),
    },
    storage_check: {
      competencyId: "storage_check",
      status: byType("drawer.contents_inspected").length > 0 ? "met" : "not-observed",
      evidenceEventIds: [...byType("drawer.label_inspected"), ...byType("drawer.contents_inspected")],
    },
    double_check_performed: {
      competencyId: "double_check_performed",
      status: state.trayInspected && allPreparedInspected ? "met" : "missed",
      evidenceEventIds: [...byType("tray.inspected"), ...byType("medication.inspected")],
    },
    instructions: {
      competencyId: "instructions",
      status: byType("instructions.given").length > 0 ? "met" : "missed",
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
