import { validateScenarioSession } from "@/features/simulation-engine/scenario-validator";
import type {
  DeterministicRandom,
  ScenarioCandidateFactory,
  ScenarioDefinition,
  ScenarioGenerationResult,
} from "@/features/simulation-engine/types";

const UINT32_MAX_PLUS_ONE = 4_294_967_296;

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createDeterministicRandom(seed: string): DeterministicRandom {
  let state = hashSeed(seed) || 0x6d2b79f5;

  const next = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_MAX_PLUS_ONE;
  };

  return {
    next,
    integer(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
        throw new Error(`Invalid integer range: ${min}-${max}`);
      }

      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick<T>(values: readonly T[]) {
      if (values.length === 0) {
        throw new Error("Cannot pick from an empty collection.");
      }

      return values[Math.floor(next() * values.length)] as T;
    },
    chance(probability) {
      if (probability < 0 || probability > 1) {
        throw new Error(`Probability must be between 0 and 1. Received ${probability}.`);
      }

      return next() < probability;
    },
  };
}

export function generateScenarioSession(
  definition: ScenarioDefinition,
  seed: string,
  factory: ScenarioCandidateFactory,
  options: { maxAttempts?: number } = {},
): ScenarioGenerationResult {
  const maxAttempts = options.maxAttempts ?? 20;

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error("maxAttempts must be a positive integer.");
  }

  const validationMessages: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const attemptSeed = `${seed}:attempt:${attempt}`;
    const random = createDeterministicRandom(attemptSeed);
    const session = factory({ attempt, seed: attemptSeed, random });
    const validation = validateScenarioSession(definition, session);

    if (validation.valid) {
      return { session, attempts: attempt };
    }

    validationMessages.push(
      `attempt ${attempt}: ${validation.issues
        .map((issue) => `${issue.code}=${issue.message}`)
        .join(", ")}`,
    );
  }

  throw new Error(
    `Unable to generate a valid simulation session after ${maxAttempts} attempts. ${validationMessages.join(" | ")}`,
  );
}
