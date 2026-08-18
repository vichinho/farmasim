import type { SimulationEvent } from "@/features/simulation-engine/types";

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
};

function lastEvent(events: readonly SimulationEvent[], type: SimulationEvent["type"]) {
  return [...events].reverse().find((event) => event.type === type);
}

export function deriveRuntimeHandoffState(
  events: readonly SimulationEvent[],
): RuntimeHandoffState {
  const correctionEvents = events.filter((event) => event.type === "correction.requested");
  const lastCorrection = correctionEvents.at(-1);
  const cycleStartSequence = lastCorrection?.sequence ?? 0;

  const traySentEvent = [...events]
    .reverse()
    .find((event) => event.type === "tray.sent" && event.sequence > cycleStartSequence);
  const trayReceivedEvent = [...events]
    .reverse()
    .find((event) => event.type === "tray.received" && event.sequence > cycleStartSequence);

  const sent = Boolean(traySentEvent);
  const received = Boolean(
    trayReceivedEvent &&
      traySentEvent &&
      trayReceivedEvent.sequence > traySentEvent.sequence,
  );

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
    trayReceivedEventId: received ? trayReceivedEvent?.id ?? null : null,
    correctionRequestedEventId: lastCorrection?.id ?? null,
  };
}
