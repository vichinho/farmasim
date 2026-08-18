import type {
  SimulationEvent,
  SimulationSession,
} from "@/features/simulation-engine/types";

export type RuntimeHandoffOwner = "preparation" | "transit" | "attention";

export type RuntimeHandoffState = {
  cycle: number;
  owner: RuntimeHandoffOwner;
  sent: boolean;
  received: boolean;
  correctionRequested: boolean;
  traySentEventId: string | null;
  trayReceivedEventId: string | null;
  correctionRequestedEventId: string | null;
  simulatedInitialSend: boolean;
  simulatedInitialReceipt: boolean;
};

export function deriveRuntimeHandoffState(
  session: SimulationSession,
  events: readonly SimulationEvent[],
): RuntimeHandoffState {
  const correctionEvents = events.filter((event) => event.type === "correction.requested");
  const lastCorrection = correctionEvents.at(-1);
  const cycleStartSequence = lastCorrection?.sequence ?? 0;
  const simulatedInitialSend = correctionEvents.length === 0 && session.playerRole === "attention";
  const simulatedInitialReceipt = simulatedInitialSend;

  const traySentEvent = [...events]
    .reverse()
    .find((event) => event.type === "tray.sent" && event.sequence > cycleStartSequence);
  const trayReceivedEvent = [...events]
    .reverse()
    .find((event) => event.type === "tray.received" && event.sequence > cycleStartSequence);

  const sent = Boolean(traySentEvent) || simulatedInitialSend;
  const sentSequence = traySentEvent?.sequence ?? (simulatedInitialSend ? 0 : Number.POSITIVE_INFINITY);
  const explicitReceipt = Boolean(
    trayReceivedEvent &&
      sent &&
      trayReceivedEvent.sequence > sentSequence,
  );
  const received = explicitReceipt || simulatedInitialReceipt;

  const owner: RuntimeHandoffOwner = !sent
    ? "preparation"
    : received
      ? "attention"
      : "transit";

  return {
    cycle: correctionEvents.length + 1,
    owner,
    sent,
    received,
    correctionRequested: Boolean(lastCorrection),
    traySentEventId: traySentEvent?.id ?? null,
    trayReceivedEventId: explicitReceipt ? trayReceivedEvent?.id ?? null : null,
    correctionRequestedEventId: lastCorrection?.id ?? null,
    simulatedInitialSend,
    simulatedInitialReceipt,
  };
}
