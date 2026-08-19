import type {
  PrescriptionDisposition,
  PrescriptionRecord,
  ScenarioDefinition,
  SimulationEvent,
} from "./types";

const proceedStatuses = new Set(["accepted", "sent"] as const);

export function expectedPrescriptionDisposition(
  prescription: PrescriptionRecord,
): PrescriptionDisposition {
  return proceedStatuses.has(prescription.status as "accepted" | "sent")
    ? "proceed"
    : "hold-for-review";
}

export function prescriptionDispositionFromEvents(
  events: SimulationEvent[],
  prescriptionId: string,
): PrescriptionDisposition | undefined {
  const event = events
    .toReversed()
    .find((candidate) =>
      candidate.type === "prescription.status_verified"
      && candidate.data.prescriptionId === prescriptionId,
    );
  const disposition = event?.data.disposition;
  return disposition === "proceed" || disposition === "hold-for-review"
    ? disposition
    : undefined;
}

export function relevantPrescriptionDispositionState(
  scenario: ScenarioDefinition,
  events: SimulationEvent[],
) {
  return scenario.prescriptionsRelevantToCurrentWithdrawal.map((prescriptionId) => {
    const prescription = scenario.prescriptions.find((item) => item.id === prescriptionId);
    if (!prescription) throw new Error(`Unknown relevant prescription: ${prescriptionId}`);
    const expected = expectedPrescriptionDisposition(prescription);
    const actual = prescriptionDispositionFromEvents(events, prescriptionId);
    return {
      prescription,
      prescriptionId,
      expected,
      actual,
      correct: actual === expected,
    };
  });
}

export function canSafelyStopForPrescriptionReview(
  scenario: ScenarioDefinition,
  events: SimulationEvent[],
) {
  const state = relevantPrescriptionDispositionState(scenario, events);
  return state.length > 0
    && state.every((item) => item.correct)
    && state.some((item) => item.expected === "hold-for-review");
}
