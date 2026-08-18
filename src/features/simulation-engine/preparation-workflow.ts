import type { SimulationEvent } from "@/features/simulation-engine/types";

export type RuntimePreparationWorkflowState = {
  confirmed: boolean;
  traySent: boolean;
  confirmedEventId: string | null;
  traySentEventId: string | null;
  correctionRequestedEventId: string | null;
};

function lastEvent(events: readonly SimulationEvent[], type: SimulationEvent["type"]) {
  return [...events].reverse().find((event) => event.type === type);
}

export function deriveRuntimePreparationWorkflow(
  events: readonly SimulationEvent[],
): RuntimePreparationWorkflowState {
  const confirmedEvent = lastEvent(events, "preparation.confirmed");
  const traySentEvent = lastEvent(events, "tray.sent");
  const correctionRequestedEvent = lastEvent(events, "correction.requested");
  const correctionSequence = correctionRequestedEvent?.sequence ?? 0;

  const confirmed = Boolean(confirmedEvent && confirmedEvent.sequence > correctionSequence);
  const traySent = Boolean(traySentEvent && traySentEvent.sequence > correctionSequence);

  return {
    confirmed,
    traySent,
    confirmedEventId: confirmed ? confirmedEvent?.id ?? null : null,
    traySentEventId: traySent ? traySentEvent?.id ?? null : null,
    correctionRequestedEventId: correctionRequestedEvent?.id ?? null,
  };
}
