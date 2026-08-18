import { evaluateSimulation } from "@/features/simulation-engine/engine";
import { deriveRuntimeMaterialState, runtimeEffectiveSession } from "@/features/simulation-engine/material-state";
import type { SimulationCheckpoint } from "@/features/simulation-engine/persistence";
import type { ProcessCriterionResult } from "@/features/simulation-engine/types";
import type { AttemptCriterionResult } from "@/types/training-simulation";

export type SimulationAttemptCompletion = {
  attemptId: string;
  startedAt: string;
  correctAnswers: number;
  incorrectAnswers: number;
  criterionResults: AttemptCriterionResult[];
};

export class SimulationCompletionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SimulationCompletionError";
  }
}

function terminalCompleted(checkpoint: SimulationCheckpoint) {
  return checkpoint.events.some((event) => event.type === "delivery.completed");
}

function criterionStatus(
  criterion: ProcessCriterionResult,
  correctionRequested: boolean,
): AttemptCriterionResult["status"] | null {
  if (criterion.status === "not-applicable") return null;

  if (
    criterion.criterionId === "criterion-5-compare-prepared-items" &&
    correctionRequested &&
    criterion.status === "met"
  ) {
    return "intercepted";
  }

  if (criterion.status === "met") return "met";
  if (criterion.status === "intercepted") return "intercepted";
  return "reinforcement";
}

async function deterministicAttemptId(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new SimulationCompletionError(
      "crypto_unavailable",
      "Web Crypto is required to derive a stable attempt identifier.",
    );
  }

  const digest = new Uint8Array(
    await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
  const bytes = digest.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Builds the existing FarmaVerse attempt payload from an append-only engine
 * checkpoint. This function deliberately does not know about Supabase or XP.
 */
export async function buildSimulationAttemptCompletion(
  checkpoint: SimulationCheckpoint,
): Promise<SimulationAttemptCompletion> {
  if (!terminalCompleted(checkpoint)) {
    throw new SimulationCompletionError(
      "session_not_completed",
      "A simulation attempt cannot be finalized before delivery.completed.",
    );
  }

  const firstEvent = checkpoint.events[0];
  if (!firstEvent) {
    throw new SimulationCompletionError(
      "missing_start_event",
      "A completed simulation must contain at least one event.",
    );
  }

  const material = deriveRuntimeMaterialState(checkpoint.session, checkpoint.events);
  const effectiveSession = runtimeEffectiveSession(checkpoint.session, material);
  const evaluation = evaluateSimulation(
    checkpoint.definition,
    effectiveSession,
    checkpoint.events,
    { validateConfiguration: false },
  );
  const correctionRequested = checkpoint.events.some(
    (event) => event.type === "correction.requested",
  );

  const criterionResults = evaluation.criteria.flatMap((criterion) => {
    const status = criterionStatus(criterion, correctionRequested);
    return status ? [{ criterionId: criterion.criterionId, status }] : [];
  });
  const correctAnswers = criterionResults.filter(
    (result) => result.status !== "reinforcement",
  ).length;
  const startedAt = firstEvent.timestamp;
  const attemptId = await deterministicAttemptId(
    `${checkpoint.session.id}:${startedAt}`,
  );

  return {
    attemptId,
    startedAt,
    correctAnswers,
    incorrectAnswers: criterionResults.length - correctAnswers,
    criterionResults,
  };
}
