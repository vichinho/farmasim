import type { DispensingCriterionId } from "@/types/training-simulation";
import { baselineContextForSeed, reinforcementVariantForSeed } from "./scenario-generator";
import type {
  EstablishmentId,
  InstructionSection,
  PlayerRole,
  SimulationSession,
} from "./types";

export type ReinforcementCompetency =
  | "patient-identification"
  | "prescription-review"
  | "preparation-comparison"
  | "final-identification"
  | "instructions";

export type ReinforcementVariantFingerprint = {
  patientId: string;
  medicationId: string;
  presentationId: string;
  establishmentId: EstablishmentId;
  challengeKey: string;
  drawerId: string;
  visualContextKey: string;
};

type ReinforcementHistoryEntry = {
  competency: ReinforcementCompetency;
  seed: number;
};

export type RecentVariantMemoryEntry = ReinforcementVariantFingerprint & {
  competencyTarget: ReinforcementCompetency;
  scenarioId: string;
  seed: number;
};

export type RecentVariantMemory = {
  entries: RecentVariantMemoryEntry[];
  windowSize: number;
};

export type ReinforcementRecommendation = {
  competency: ReinforcementCompetency;
  failedCriterionIds: DispensingCriterionId[];
  scenarioId: string;
  seed: number;
  variant: ReinforcementVariantFingerprint;
  targetPlayerRole: PlayerRole;
  targetInstructionSection?: InstructionSection;
};

const competencyByCriterion: Record<DispensingCriterionId, ReinforcementCompetency> = {
  "criterion-1-request-identity-document": "patient-identification",
  "criterion-2-system-identity-match": "patient-identification",
  "criterion-3-identify-all-prescriptions": "prescription-review",
  "criterion-4-confirm-prescription-issued": "prescription-review",
  "criterion-5-compare-prepared-items": "preparation-comparison",
  "criterion-6-recheck-identity-before-handoff": "final-identification",
  "criterion-7-provide-corresponding-instructions": "instructions",
};

const targetRoleByCompetency: Record<ReinforcementCompetency, PlayerRole> = {
  "patient-identification": "tens-1",
  "prescription-review": "tens-1",
  "preparation-comparison": "tens-2",
  "final-identification": "tens-1",
  instructions: "tens-1",
};

const knownCompetencies = new Set<ReinforcementCompetency>([
  "patient-identification",
  "prescription-review",
  "preparation-comparison",
  "final-identification",
  "instructions",
]);

const HISTORY_LIMIT = 3;

function nextSeed(seed: number) {
  return (Math.imul(seed ^ 0x9e3779b9, 1664525) + 1013904223) >>> 0;
}

function encodeHistory(entries: ReinforcementHistoryEntry[]) {
  return entries
    .slice(0, HISTORY_LIMIT)
    .map((entry) => `${entry.competency}.${entry.seed.toString(36)}`)
    .join(",");
}

export function parseReinforcementScenarioId(id: string) {
  if (!id.startsWith("reinforcement__")) return null;
  const [, competencyRaw, seedRaw, historyRaw = ""] = id.split("__");
  if (!knownCompetencies.has(competencyRaw as ReinforcementCompetency)) return null;
  const seed = Number.parseInt(seedRaw, 36);
  if (!Number.isFinite(seed)) return null;
  const history = historyRaw
    .split(",")
    .filter(Boolean)
    .flatMap((entry) => {
      const splitAt = entry.lastIndexOf(".");
      if (splitAt <= 0) return [];
      const competency = entry.slice(0, splitAt) as ReinforcementCompetency;
      const parsedSeed = Number.parseInt(entry.slice(splitAt + 1), 36);
      return knownCompetencies.has(competency) && Number.isFinite(parsedSeed)
        ? [{ competency, seed: parsedSeed }]
        : [];
    });
  return { competency: competencyRaw as ReinforcementCompetency, seed, history };
}

export function targetPlayerRoleForCompetency(competency: ReinforcementCompetency) {
  return targetRoleByCompetency[competency];
}

function fingerprintForEntry(entry: ReinforcementHistoryEntry) {
  return reinforcementVariantForSeed(entry.seed, entry.competency);
}

function canonicalScenarioId(entry: ReinforcementHistoryEntry) {
  return `reinforcement__${entry.competency}__${entry.seed.toString(36)}`;
}

function recentHistory(session: SimulationSession, recentScenarioIds: string[]) {
  const parsedCurrent = parseReinforcementScenarioId(session.scenarioId);
  const entries: ReinforcementHistoryEntry[] = [];
  if (parsedCurrent) entries.push(...parsedCurrent.history);
  for (const scenarioId of recentScenarioIds) {
    const parsed = parseReinforcementScenarioId(scenarioId);
    if (!parsed) continue;
    entries.push({ competency: parsed.competency, seed: parsed.seed }, ...parsed.history);
  }
  const unique = new Map<string, ReinforcementHistoryEntry>();
  for (const entry of entries) unique.set(`${entry.competency}:${entry.seed}`, entry);
  return [...unique.values()].slice(0, HISTORY_LIMIT - 1);
}

function currentFingerprint(session: SimulationSession, competency: ReinforcementCompetency) {
  const parsed = parseReinforcementScenarioId(session.scenarioId);
  if (parsed) return reinforcementVariantForSeed(parsed.seed, parsed.competency);
  const baseline = baselineContextForSeed(session.seed);
  const discrepancyKind = session.discrepancies[0]?.kind;
  const challengeKey = discrepancyKind
    ? `${competency}:${discrepancyKind}`
    : `${competency}:criterion-miss`;
  return { ...baseline, challengeKey };
}

export function buildRecentVariantMemory(
  session: SimulationSession,
  competency: ReinforcementCompetency,
  recentScenarioIds: string[] = [],
): RecentVariantMemory {
  const currentParsed = parseReinforcementScenarioId(session.scenarioId);
  const currentVariant = currentFingerprint(session, competency);
  const history = recentHistory(session, recentScenarioIds);
  const entries: RecentVariantMemoryEntry[] = [
    {
      ...currentVariant,
      competencyTarget: currentParsed?.competency ?? competency,
      scenarioId: session.scenarioId,
      seed: currentParsed?.seed ?? session.seed,
    },
    ...history.map((entry) => ({
      ...fingerprintForEntry(entry),
      competencyTarget: entry.competency,
      scenarioId: canonicalScenarioId(entry),
      seed: entry.seed,
    })),
  ].slice(0, HISTORY_LIMIT);
  return { entries, windowSize: HISTORY_LIMIT };
}

function differsFromRecent(
  candidate: ReinforcementVariantFingerprint,
  memory: RecentVariantMemory,
) {
  const [immediate] = memory.entries;
  const differsCore = memory.entries.every((previous) =>
    candidate.patientId !== previous.patientId
    && candidate.medicationId !== previous.medicationId
    && candidate.presentationId !== previous.presentationId
    && candidate.establishmentId !== previous.establishmentId
    && candidate.challengeKey !== previous.challengeKey,
  );
  if (!differsCore) return false;
  return !immediate || (
    candidate.drawerId !== immediate.drawerId
    && candidate.visualContextKey !== immediate.visualContextKey
  );
}

function noveltyScore(
  candidate: ReinforcementVariantFingerprint,
  memory: RecentVariantMemory,
) {
  return memory.entries.reduce((score, previous, index) => score
    + Number(candidate.patientId !== previous.patientId)
    + Number(candidate.medicationId !== previous.medicationId)
    + Number(candidate.presentationId !== previous.presentationId)
    + Number(candidate.establishmentId !== previous.establishmentId)
    + Number(candidate.challengeKey !== previous.challengeKey)
    + (index === 0 ? Number(candidate.drawerId !== previous.drawerId) : 0)
    + (index === 0 ? Number(candidate.visualContextKey !== previous.visualContextKey) : 0), 0);
}

function preferredInstructionSection(
  session: SimulationSession,
  recentFingerprints: ReinforcementVariantFingerprint[],
) {
  if (!session.missingInstructionSections.length) return undefined;
  const recentlyUsed = new Set(recentFingerprints.map((item) => item.challengeKey));
  return session.missingInstructionSections.find(
    (section) => !recentlyUsed.has(`instructions-${section}`),
  ) ?? session.missingInstructionSections[0];
}

export function recommendReinforcement(
  session: SimulationSession,
  recentScenarioIds: string[] = [],
): ReinforcementRecommendation | null {
  const failedCriterionIds = Object.entries(session.criteria)
    .filter(([, status]) => status === "reinforcement")
    .map(([criterionId]) => criterionId as DispensingCriterionId);
  if (!failedCriterionIds.length) return null;

  const grouped = failedCriterionIds.reduce(
    (counts, criterionId) => {
      const competency = competencyByCriterion[criterionId];
      counts.set(competency, (counts.get(competency) ?? 0) + 1);
      return counts;
    },
    new Map<ReinforcementCompetency, number>(),
  );
  const competency = [...grouped.entries()].sort((left, right) => right[1] - left[1])[0][0];
  const parsedCurrent = parseReinforcementScenarioId(session.scenarioId);
  const historyEntries = recentHistory(session, recentScenarioIds);
  const memory = buildRecentVariantMemory(session, competency, recentScenarioIds);
  const recentFingerprints = memory.entries;
  const targetInstructionSection = competency === "instructions"
    ? preferredInstructionSection(session, recentFingerprints)
    : undefined;
  const targetChallengeKey = targetInstructionSection
    ? `instructions-${targetInstructionSection}`
    : undefined;

  let seed = nextSeed(session.seed);
  let bestSeed = seed;
  let bestVariant = reinforcementVariantForSeed(seed, competency);
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let attempt = 0; attempt < 512; attempt += 1) {
    const variant = reinforcementVariantForSeed(seed, competency);
    const matchesTarget = !targetChallengeKey || variant.challengeKey === targetChallengeKey;
    const isKnownScenario = memory.entries.some(
      (entry) => entry.competencyTarget === competency && entry.seed === seed,
    );
    const score = noveltyScore(variant, memory) + (matchesTarget ? 1000 : 0) - (isKnownScenario ? 5000 : 0);
    if (score > bestScore) {
      bestSeed = seed;
      bestVariant = variant;
      bestScore = score;
    }
    if (!isKnownScenario && matchesTarget && differsFromRecent(variant, memory)) {
      bestSeed = seed;
      bestVariant = variant;
      break;
    }
    seed = nextSeed(seed);
  }

  const nextHistory: ReinforcementHistoryEntry[] = [
    ...(parsedCurrent ? [{ competency: parsedCurrent.competency, seed: parsedCurrent.seed }] : []),
    ...historyEntries,
  ].slice(0, HISTORY_LIMIT);
  const historySuffix = encodeHistory(nextHistory);
  const scenarioId = `reinforcement__${competency}__${bestSeed.toString(36)}__${historySuffix}`;

  return {
    competency,
    failedCriterionIds,
    scenarioId,
    seed: bestSeed,
    variant: bestVariant,
    targetPlayerRole: targetRoleByCompetency[competency],
    targetInstructionSection,
  };
}
