import type {
  DeterministicRandom,
  HealthcareFacility,
  MedicationPresentation,
  PrescriptionStatus,
  ScenarioDefinition,
  SyntheticPatient,
} from "@/features/simulation-engine/types";

export type DifficultyProfile = {
  recordCount: { min: number; max: number };
  relevantPrescriptionCount: { min: number; max: number };
  facilityCount: { min: number; max: number };
  similarPatientDistractorChance: number;
  historicalSameMedicationChance: number;
  shuffleRecordOrder: boolean;
  historicalStatuses: readonly PrescriptionStatus[];
};

export const DIFFICULTY_PROFILES: Record<ScenarioDefinition["difficulty"], DifficultyProfile> = {
  initial: {
    recordCount: { min: 1, max: 2 },
    relevantPrescriptionCount: { min: 1, max: 1 },
    facilityCount: { min: 1, max: 1 },
    similarPatientDistractorChance: 0,
    historicalSameMedicationChance: 0,
    shuffleRecordOrder: false,
    historicalStatuses: ["completed", "historical"],
  },
  medium: {
    recordCount: { min: 3, max: 5 },
    relevantPrescriptionCount: { min: 1, max: 2 },
    facilityCount: { min: 1, max: 2 },
    similarPatientDistractorChance: 0.3,
    historicalSameMedicationChance: 0.2,
    shuffleRecordOrder: true,
    historicalStatuses: ["dispensed", "completed", "historical"],
  },
  high: {
    recordCount: { min: 6, max: 10 },
    relevantPrescriptionCount: { min: 2, max: 4 },
    facilityCount: { min: 2, max: 4 },
    similarPatientDistractorChance: 0.7,
    historicalSameMedicationChance: 0.5,
    shuffleRecordOrder: true,
    historicalStatuses: ["dispensed", "completed", "rejected", "historical"],
  },
  expert: {
    recordCount: { min: 10, max: 15 },
    relevantPrescriptionCount: { min: 3, max: 5 },
    facilityCount: { min: 3, max: 6 },
    similarPatientDistractorChance: 1,
    historicalSameMedicationChance: 0.75,
    shuffleRecordOrder: true,
    historicalStatuses: ["dispensed", "completed", "rejected", "historical"],
  },
};

export function getDifficultyProfile(
  difficulty: ScenarioDefinition["difficulty"],
): DifficultyProfile {
  return DIFFICULTY_PROFILES[difficulty];
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL");
}

function patientSimilarityScore(target: SyntheticPatient, candidate: SyntheticPatient): number {
  let score = 0;
  const targetFirst = normalizeName(target.firstName);
  const candidateFirst = normalizeName(candidate.firstName);

  if (normalizeName(target.lastName1) === normalizeName(candidate.lastName1)) score += 5;
  if (normalizeName(target.lastName2) === normalizeName(candidate.lastName2)) score += 3;
  if (targetFirst === candidateFirst) score += 5;
  else if (targetFirst.slice(0, 4) === candidateFirst.slice(0, 4)) score += 2;

  return score;
}

export function selectDistractorPatient(
  target: SyntheticPatient,
  patients: readonly SyntheticPatient[],
  random: DeterministicRandom,
  profile: DifficultyProfile,
): SyntheticPatient {
  const candidates = patients.filter((patient) => patient.id !== target.id);
  if (candidates.length === 0) {
    throw new Error("Difficulty generation requires at least one distractor patient.");
  }

  if (random.chance(profile.similarPatientDistractorChance)) {
    const scored = candidates
      .map((patient) => ({ patient, score: patientSimilarityScore(target, patient) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
    const bestScore = scored[0]?.score;
    const best = scored.filter((item) => item.score === bestScore).map((item) => item.patient);
    if (best.length > 0) return random.pick(best);
  }

  return random.pick(candidates);
}

export function selectFacilityPool(
  facilities: readonly HealthcareFacility[],
  random: DeterministicRandom,
  profile: DifficultyProfile,
): HealthcareFacility[] {
  const maximum = Math.min(profile.facilityCount.max, facilities.length);
  const minimum = Math.min(profile.facilityCount.min, maximum);
  const targetCount = random.integer(minimum, maximum);
  const available = [...facilities];
  const selected: HealthcareFacility[] = [];

  while (selected.length < targetCount) {
    const index = random.integer(0, available.length - 1);
    const [facility] = available.splice(index, 1);
    if (facility) selected.push(facility);
  }

  return selected;
}

export function selectHistoricalPresentation(
  primaryPresentation: MedicationPresentation,
  presentations: readonly MedicationPresentation[],
  random: DeterministicRandom,
  profile: DifficultyProfile,
): MedicationPresentation {
  if (random.chance(profile.historicalSameMedicationChance)) {
    const sameMedication = presentations.filter(
      (candidate) =>
        candidate.medicationId === primaryPresentation.medicationId &&
        candidate.id !== primaryPresentation.id,
    );
    if (sameMedication.length > 0) return random.pick(sameMedication);
  }

  return random.pick(presentations);
}

export function shuffleDeterministically<T>(
  values: readonly T[],
  random: DeterministicRandom,
): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = random.integer(0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex] as T, shuffled[index] as T];
  }
  return shuffled;
}
