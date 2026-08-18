import type { SimulationEvent, SimulationEventType } from "@/features/simulation-engine/types";

type AppendEventInput = {
  actorId: string;
  type: SimulationEventType;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
};

function cloneEvent(event: SimulationEvent): SimulationEvent {
  return {
    ...event,
    metadata: event.metadata ? { ...event.metadata } : undefined,
  };
}

function validateHydratedEvents(sessionId: string, events: readonly SimulationEvent[]) {
  for (const [index, event] of events.entries()) {
    const expectedSequence = index + 1;
    if (event.sessionId !== sessionId) {
      throw new Error(
        `Cannot hydrate event ${event.id}: expected session ${sessionId}, received ${event.sessionId}.`,
      );
    }
    if (event.sequence !== expectedSequence) {
      throw new Error(
        `Cannot hydrate event ${event.id}: expected sequence ${expectedSequence}, received ${event.sequence}.`,
      );
    }
  }
}

export class SimulationEventLog {
  readonly #events: SimulationEvent[] = [];

  constructor(
    private readonly sessionId: string,
    initialEvents: readonly SimulationEvent[] = [],
  ) {
    validateHydratedEvents(sessionId, initialEvents);
    this.#events.push(...initialEvents.map(cloneEvent));
  }

  append(input: AppendEventInput): SimulationEvent {
    const sequence = this.#events.length + 1;
    const event: SimulationEvent = {
      id: `${this.sessionId}:event:${sequence}`,
      sessionId: this.sessionId,
      sequence,
      timestamp: input.timestamp ?? new Date().toISOString(),
      actorId: input.actorId,
      type: input.type,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata,
    };

    this.#events.push(event);
    return cloneEvent(event);
  }

  all(): readonly SimulationEvent[] {
    return this.#events.map(cloneEvent);
  }
}
