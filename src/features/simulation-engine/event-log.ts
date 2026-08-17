import type { SimulationEvent, SimulationEventType } from "@/features/simulation-engine/types";

type AppendEventInput = {
  actorId: string;
  type: SimulationEventType;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
};

export class SimulationEventLog {
  readonly #events: SimulationEvent[] = [];

  constructor(private readonly sessionId: string) {}

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
    return event;
  }

  all(): readonly SimulationEvent[] {
    return this.#events;
  }
}
