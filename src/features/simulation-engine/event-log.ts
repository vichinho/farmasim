import type { SimulationCommand, SimulationEvent, SimulationSession } from "./types";

export function appendEvent(
  session: SimulationSession,
  command: SimulationCommand,
  occurredAt = new Date().toISOString(),
): SimulationEvent {
  const sequence = session.eventLog.length + 1;

  return {
    id: `${session.id}:${sequence}`,
    sequence,
    occurredAt,
    actorId: command.actorId,
    type: command.type,
    data: command.data ?? {},
  };
}
export function hasEvent(
  events: SimulationEvent[],
  type: SimulationEvent["type"],
  predicate?: (event: SimulationEvent) => boolean,
) {
  return events.some((event) => event.type === type && (!predicate || predicate(event)));
}

export function eventValues(events: SimulationEvent[], type: SimulationEvent["type"], key: string) {
  return events
    .filter((event) => event.type === type)
    .map((event) => event.data[key])
    .filter((value): value is string => typeof value === "string");
}
