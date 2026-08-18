import type { SimulationCatalogs } from "@/features/simulation-engine/catalogs";
import { generateScenarioSession } from "@/features/simulation-engine/scenario-generator";
import type {
  ClinicalRecord,
  DeterministicRandom,
  Drawer,
  GameMode,
  MedicationPresentation,
  Prescription,
  PrescriptionStatus,
  ScenarioDefinition,
  ScenarioGenerationResult,
  SimulationRole,
  SimulationSession,
  SyntheticPatient,
} from "@/features/simulation-engine/types";

type DifficultyProfile = {
  recordCount: { min: number; max: number };
  relevantPrescriptionCount: { min: number; max: number };
};

const DIFFICULTY_PROFILES: Record<ScenarioDefinition["difficulty"], DifficultyProfile> = {
  initial: {
    recordCount: { min: 1, max: 2 },
    relevantPrescriptionCount: { min: 1, max: 1 },
  },
  medium: {
    recordCount: { min: 3, max: 5 },
    relevantPrescriptionCount: { min: 1, max: 2 },
  },
  high: {
    recordCount: { min: 6, max: 10 },
    relevantPrescriptionCount: { min: 2, max: 4 },
  },
  expert: {
    recordCount: { min: 10, max: 15 },
    relevantPrescriptionCount: { min: 2, max: 5 },
  },
};

const NON_CURRENT_STATUSES: PrescriptionStatus[] = [
  "dispensed",
  "completed",
  "rejected",
  "historical",
];

export type DynamicScenarioGenerationOptions = {
  playerRole?: SimulationRole;
  mode?: GameMode;
  maxAttempts?: number;
};

function stableToken(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function uniquePick<T extends { id: string }>(
  random: DeterministicRandom,
  values: readonly T[],
  excludedIds: ReadonlySet<string> = new Set(),
): T {
  const available = values.filter((value) => !excludedIds.has(value.id));
  if (available.length === 0) throw new Error("No catalog values available after exclusions.");
  return random.pick(available);
}

function addDays(iso: string, days: number): string {
  const value = new Date(iso);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString();
}

function deterministicGeneratedAt(random: DeterministicRandom): string {
  const dayOffset = random.integer(0, 364);
  const hour = random.integer(8, 16);
  return new Date(Date.UTC(2026, 0, 1 + dayOffset, hour, 0, 0)).toISOString();
}

function findAlternateStrength(
  requested: MedicationPresentation,
  presentations: readonly MedicationPresentation[],
): MedicationPresentation | undefined {
  return presentations.find(
    (candidate) =>
      candidate.medicationId === requested.medicationId &&
      candidate.id !== requested.id &&
      candidate.strength !== requested.strength &&
      candidate.pharmaceuticalForm === requested.pharmaceuticalForm,
  );
}

function strengthCapablePresentations(
  presentations: readonly MedicationPresentation[],
): MedicationPresentation[] {
  return presentations.filter((presentation) => findAlternateStrength(presentation, presentations));
}

function assertCatalogs(catalogs: SimulationCatalogs, definition: ScenarioDefinition) {
  if (catalogs.patients.length < 2) {
    throw new Error("Dynamic scenario generation requires at least two synthetic patients.");
  }
  if (catalogs.facilities.length === 0) {
    throw new Error("Dynamic scenario generation requires at least one healthcare facility.");
  }
  if (catalogs.presentations.length === 0) {
    throw new Error("Dynamic scenario generation requires at least one medication presentation.");
  }
  if (
    (definition.type === "concentration_error" ||
      definition.type === "storage_label_and_mixed_contents") &&
    strengthCapablePresentations(catalogs.presentations).length === 0
  ) {
    throw new Error(
      `Scenario ${definition.type} requires at least one medication with two compatible strengths in the catalog.`,
    );
  }
}

function createActors(playerRole: SimulationRole) {
  return [
    {
      id: "actor-attention",
      role: "attention" as const,
      controller: playerRole === "attention" ? ("player_1" as const) : ("simulation" as const),
    },
    {
      id: "actor-preparation",
      role: "preparation" as const,
      controller: playerRole === "preparation" ? ("player_1" as const) : ("simulation" as const),
    },
  ];
}

function choosePrimaryPresentation(
  definition: ScenarioDefinition,
  random: DeterministicRandom,
  catalogs: SimulationCatalogs,
): MedicationPresentation {
  if (
    definition.type === "concentration_error" ||
    definition.type === "storage_label_and_mixed_contents"
  ) {
    return random.pick(strengthCapablePresentations(catalogs.presentations));
  }
  return random.pick(catalogs.presentations);
}

function createPrescriptionSet(
  definition: ScenarioDefinition,
  random: DeterministicRandom,
  catalogs: SimulationCatalogs,
  generatedAt: string,
  primaryPresentation: MedicationPresentation,
): { prescriptions: Prescription[]; records: ClinicalRecord[] } {
  const profile = DIFFICULTY_PROFILES[definition.difficulty];
  const minimumRecords =
    definition.type === "incomplete_prescription_review"
      ? Math.max(3, profile.recordCount.min)
      : profile.recordCount.min;
  const maximumRecords = Math.max(minimumRecords, profile.recordCount.max);
  const recordCount = random.integer(minimumRecords, maximumRecords);
  const relevantCount = Math.min(
    recordCount,
    random.integer(
      profile.relevantPrescriptionCount.min,
      profile.relevantPrescriptionCount.max,
    ),
  );

  const prescriptions: Prescription[] = [];
  const records: ClinicalRecord[] = [];

  for (let index = 0; index < recordCount; index += 1) {
    const isRelevant = index < relevantCount;
    const presentation = index === 0 ? primaryPresentation : random.pick(catalogs.presentations);
    const facility = random.pick(catalogs.facilities);
    const daysAgo = random.integer(1, 150) + index;
    const issuedAt = addDays(generatedAt, -daysAgo);
    const prescriptionId = `rx-${index + 1}-${presentation.id}`;

    prescriptions.push({
      id: prescriptionId,
      presentationId: presentation.id,
      quantity: random.integer(1, 2),
      status: isRelevant ? "pending" : random.pick(NON_CURRENT_STATUSES),
      facilityId: facility.id,
      relevantForCurrentWithdrawal: isRelevant,
      issuedAt,
      admittedAt: addDays(issuedAt, random.integer(0, 2)),
      withdrawalDate: isRelevant ? addDays(generatedAt, random.integer(-2, 3)) : undefined,
      lastWithdrawalDate: !isRelevant && random.chance(0.55) ? addDays(issuedAt, random.integer(7, 35)) : undefined,
      dispatchDate: !isRelevant && random.chance(0.55) ? addDays(issuedAt, random.integer(1, 20)) : undefined,
      nextWithdrawalDate: isRelevant && random.chance(0.35) ? addDays(generatedAt, random.integer(20, 45)) : undefined,
      repetitionStatus: random.pick(["yes", "no", "review"] as const),
    });

    records.push({
      id: `record-${index + 1}`,
      patientId: "__TARGET_PATIENT__",
      facilityId: facility.id,
      prescriptionIds: [prescriptionId],
    });
  }

  return { prescriptions, records };
}

function createDrawer(
  definition: ScenarioDefinition,
  requested: MedicationPresentation,
  catalogs: SimulationCatalogs,
): Drawer {
  const alternate = findAlternateStrength(requested, catalogs.presentations);
  const drawerId = `drawer-${requested.medicationId}`;
  const expectedLabel = `${requested.genericName.toUpperCase()} ${requested.strength}`;

  if (definition.type === "storage_label_and_mixed_contents") {
    if (!alternate) {
      throw new Error("Storage mismatch scenario requires an alternate strength.");
    }

    return {
      id: drawerId,
      sectorId: requested.genericName.slice(0, 1).toUpperCase(),
      expectedMedicationPresentationId: requested.id,
      expectedLabel,
      displayedLabel: `${alternate.genericName.toUpperCase()} ${alternate.strength}`,
      physicalCondition: "good",
      stockState: "available",
      contents: [
        {
          id: `${drawerId}:expected:1`,
          presentationId: requested.id,
          quantity: 5,
          position: { row: 0, column: 0, depth: 0 },
        },
        {
          id: `${drawerId}:mixed:1`,
          presentationId: alternate.id,
          quantity: 1,
          position: { row: 0, column: 1, depth: 1 },
        },
      ],
    };
  }

  return {
    id: drawerId,
    sectorId: requested.genericName.slice(0, 1).toUpperCase(),
    expectedMedicationPresentationId: requested.id,
    expectedLabel,
    displayedLabel: expectedLabel,
    physicalCondition: "good",
    stockState: "available",
    contents: [
      {
        id: `${drawerId}:expected:1`,
        presentationId: requested.id,
        quantity: 6,
        position: { row: 0, column: 0, depth: 0 },
      },
    ],
  };
}

function createCandidate(
  definition: ScenarioDefinition,
  catalogs: SimulationCatalogs,
  options: DynamicScenarioGenerationOptions,
  input: { attempt: number; seed: string; random: DeterministicRandom },
): SimulationSession {
  const { random } = input;
  const generatedAt = deterministicGeneratedAt(random);
  const targetPatient = uniquePick(random, catalogs.patients);
  const distractorPatient = uniquePick(random, catalogs.patients, new Set([targetPatient.id]));
  const primaryPresentation = choosePrimaryPresentation(definition, random, catalogs);
  const generated = createPrescriptionSet(
    definition,
    random,
    catalogs,
    generatedAt,
    primaryPresentation,
  );

  const records = generated.records.map((record) => ({ ...record, patientId: targetPatient.id }));
  const relevantPrescriptions = generated.prescriptions.filter(
    (prescription) => prescription.relevantForCurrentWithdrawal,
  );
  const requestedItems = relevantPrescriptions.map((prescription) => ({
    presentationId: prescription.presentationId,
    quantity: prescription.quantity,
  }));

  if (requestedItems.length === 0) {
    throw new Error("Generated session has no relevant prescriptions.");
  }

  let preparedItems = requestedItems.map((item) => ({ ...item }));
  if (definition.type === "concentration_error") {
    const requestedPresentation = catalogs.presentations.find(
      (presentation) => presentation.id === requestedItems[0]?.presentationId,
    );
    if (!requestedPresentation) throw new Error("Requested presentation is missing from catalog.");
    const alternate = findAlternateStrength(requestedPresentation, catalogs.presentations);
    if (!alternate) throw new Error("Concentration scenario requires an alternate strength.");
    preparedItems = [
      { presentationId: alternate.id, quantity: requestedItems[0]?.quantity ?? 1 },
      ...requestedItems.slice(1),
    ];
  }

  const playerRole =
    options.playerRole ??
    (definition.type === "storage_label_and_mixed_contents" ? "preparation" : "attention");
  const mode = options.mode ?? "practice";
  const firstRequested = catalogs.presentations.find(
    (presentation) => presentation.id === requestedItems[0]?.presentationId,
  );
  if (!firstRequested) throw new Error("Cannot create drawer without requested presentation.");

  const sessionToken = stableToken(`${definition.id}:${input.seed}`);
  const initialClinicalSystemState =
    definition.type === "wrong_patient_context"
      ? ({ type: "previous_patient_open", patientId: distractorPatient.id } as const)
      : ({ type: "clean_search" } as const);

  return {
    id: `session-${definition.id}-${sessionToken}`,
    schemaVersion: 1,
    seed: input.seed,
    scenarioDefinitionId: definition.id,
    scenarioDefinitionVersion: definition.version,
    generatedAt,
    mode,
    playerRole,
    actors: createActors(playerRole),
    patientId: targetPatient.id,
    patients: [targetPatient, distractorPatient],
    facilities: [...catalogs.facilities],
    presentations: [...catalogs.presentations],
    records,
    prescriptions: generated.prescriptions,
    drawers: [createDrawer(definition, firstRequested, catalogs)],
    preparation: {
      requestedItems,
      preparedItems,
      preparedBy: "actor-preparation",
      createdAt: addDays(generatedAt, 0),
      status: "received",
    },
    initialClinicalSystemState,
  };
}

export function generateDynamicScenarioSession(
  definition: ScenarioDefinition,
  seed: string,
  catalogs: SimulationCatalogs,
  options: DynamicScenarioGenerationOptions = {},
): ScenarioGenerationResult {
  assertCatalogs(catalogs, definition);

  if (options.playerRole && !definition.allowedRoles.includes(options.playerRole)) {
    throw new Error(`Role ${options.playerRole} is not allowed by scenario ${definition.id}.`);
  }
  if (options.mode && !definition.allowedModes.includes(options.mode)) {
    throw new Error(`Mode ${options.mode} is not allowed by scenario ${definition.id}.`);
  }

  return generateScenarioSession(
    definition,
    seed,
    (context) => createCandidate(definition, catalogs, options, context),
    { maxAttempts: options.maxAttempts },
  );
}

export function describeGeneratedPatient(patient: SyntheticPatient): string {
  return `${patient.firstName} ${patient.lastName1} ${patient.lastName2}`;
}
