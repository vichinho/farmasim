import type { SimulationEvent } from "@/features/simulation-engine/types";

export type RuntimePreparationWorkflowState = {
  confirmed: boolean;
  traySent: boolean;
  confirmedEventId: string | null;
  traySentEventId: string | null;
};

export function deriveRuntimePreparationWorkflow(
  events: readonly SimulationEvent[],
): RuntimePreparationWorkflowState {
  const confirmedEvent = [...events].reverse().find((event) => event.type === "preparation.confirmed");
  const traySentEvent = [...events].reverse().find((event) => event.type === "tray.sent");

  return {
    confirmed: Boolean(confirmedEvent),
    traySent: Boolean(traySentEvent),
    confirmedEventId: confirmedEvent?.id ?? null,
    traySentEventId: traySentEvent?.id ?? null,
  };
}
