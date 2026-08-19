import { alternativeStrengthPresentations } from "@/data/simulation/arsenal";
import { scenario001 } from "@/data/simulation/scenario-001";
import type {
  InstructionSection,
  MedicationPresentation,
  ScenarioDefinition,
  SimulationMode,
} from "./types";
import { assertValidScenarioDefinition } from "./scenario-validator";
import type { ReinforcementCompetency, ReinforcementVariantFingerprint } from "./reinforcement-engine";

function hashSeed(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededIndex(seed: number, length: number) {
  let state = seed || 1;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return (state >>> 0) % length;
}

const syntheticPatients: ScenarioDefinition["patient"][] = [
  scenario001.patient,
  {
    ...scenario001.patient,
    id: "patient-carolina-soto",
    firstName: "Carolina",
    paternalSurname: "Soto",
    maternalSurname: "Vera",
    rut: "16.542.781-3",
    age: 58,
  },
  {
    ...scenario001.patient,
    id: "patient-diego-morales",
    firstName: "Diego",
    paternalSurname: "Morales",
    maternalSurname: "Rojas",
    rut: "19.331.245-K",
    age: 36,
  },
  {
    ...scenario001.patient,
    id: "patient-ana-contreras",
    firstName: "Ana",
    paternalSurname: "Contreras",
    maternalSurname: "Muñoz",
    rut: "14.218.930-5",
    age: 64,
  },
  {
    ...scenario001.patient,
    id: "patient-luis-sepulveda",
    firstName: "Luis",
    paternalSurname: "Sepúlveda",
    maternalSurname: "Pérez",
    rut: "11.903.442-6",
    age: 73,
  },
  {
    ...scenario001.patient,
    id: "patient-camila-herrera",
    firstName: "Camila",
    paternalSurname: "Herrera",
    maternalSurname: "Silva",
    rut: "18.202.114-8",
    age: 42,
  },
  {
    ...scenario001.patient,
    id: "patient-jorge-navarro",
    firstName: "Jorge",
    paternalSurname: "Navarro",
    maternalSurname: "Leiva",
    rut: "10.774.621-6",
    age: 76,
  },
  {
    ...scenario001.patient,
    id: "patient-paula-mendez",
    firstName: "Paula",
    paternalSurname: "Méndez",
    maternalSurname: "Araya",
    rut: "17.610.554-9",
    age: 51,
  },
];

const establishments: ScenarioDefinition["prescriptions"][number]["establishmentId"][] = [
  "hospital-tome",
  "hospital-las-higueras",
  "cesfam-bellavista",
  "cesfam-alberto-reyes",
  "cosam",
  "san-rafael",
  "penco",
  "lirquen",
];

const statuses: ScenarioDefinition["prescriptions"][number]["status"][] = [
  "pending",
  "accepted",
  "sent",
  "dispensed",
  "completed",
  "rejected",
  "historical",
];

const reinforcementChallengeKeys: Record<ReinforcementCompetency, string[]> = {
  "patient-identification": [
    "patient-previous-record",
    "patient-similar-identity",
    "patient-ambiguous-context",
  ],
  "prescription-review": [
    "prescription-pending-status",
    "prescription-historical-lookalike",
    "prescription-multiple-establishments",
  ],
  "preparation-comparison": [
    "preparation-wrong-strength",
    "preparation-wrong-product",
    "preparation-wrong-quantity",
  ],
  "final-identification": [
    "final-similar-identity",
    "final-previous-record",
    "final-handoff-recheck",
  ],
  instructions: [
    "instructions-purpose",
    "instructions-schedule-administration",
    "instructions-precautions",
    "instructions-qf-escalation",
  ],
};

const instructionSectionByChallenge: Record<string, InstructionSection> = {
  "instructions-purpose": "purpose",
  "instructions-schedule-administration": "schedule-administration",
  "instructions-precautions": "precautions",
  "instructions-qf-escalation": "qf-escalation",
};

const knownReinforcementCompetencies = new Set<ReinforcementCompetency>([
  "patient-identification",
  "prescription-review",
  "preparation-comparison",
  "final-identification",
  "instructions",
]);

type RuntimeScenarioDescriptor = {
  kind: "reinforcement" | "pilot";
  competency: ReinforcementCompetency;
  seed?: number;
  challengeKey?: string;
};

function runtimeScenarioDescriptor(id: string): RuntimeScenarioDescriptor | undefined {
  const [kindPart, competencyPart, seedPart, challengeKey] = id.split("__");
  if (kindPart !== "reinforcement" && kindPart !== "pilot") return undefined;
  const competency = competencyPart as ReinforcementCompetency | undefined;
  if (!competency || !knownReinforcementCompetencies.has(competency)) return undefined;

  if (kindPart === "reinforcement") {
    return { kind: "reinforcement", competency };
  }

  const parsedSeed = Number(seedPart);
  if (!Number.isSafeInteger(parsedSeed) || parsedSeed < 0) return undefined;
  return {
    kind: "pilot",
    competency,
    seed: parsedSeed,
    challengeKey: challengeKey || undefined,
  };
}

function requiredRoleForCompetency(competency: ReinforcementCompetency | undefined) {
  if (!competency) return undefined;
  return competency === "preparation-comparison" ? "tens-2" as const : "tens-1" as const;
}

const generalPresentationPool = scenario001.arsenal.filter((presentation) =>
  presentation.careSetting === "atencion-abierta"
  && !presentation.strength.startsWith("NO ESPECIFICADA"),
);

const strengthChallengePool = generalPresentationPool.filter((presentation) =>
  alternativeStrengthPresentations(presentation.id).some(
    (candidate) => candidate.pharmaceuticalForm === presentation.pharmaceuticalForm,
  ),
);

if (!generalPresentationPool.length) {
  throw new Error("Atención Abierta arsenal has no presentations with an explicit strength");
}
if (!strengthChallengePool.length) {
  throw new Error("Atención Abierta arsenal has no presentation with a real alternative strength");
}

function patientForSeed(seed: number) {
  return syntheticPatients[seededIndex(seed + 17, syntheticPatients.length)];
}

function presentationFromPool(seed: number, pool: MedicationPresentation[]) {
  return pool[seededIndex(seed + 97, pool.length)];
}

function presentationForCompetency(seed: number, competency: ReinforcementCompetency) {
  return presentationFromPool(
    seed,
    competency === "preparation-comparison" ? strengthChallengePool : generalPresentationPool,
  );
}

function establishmentForSeed(seed: number) {
  return establishments[seededIndex(seed + 193, establishments.length)];
}

function differentEstablishment(excluded: ScenarioDefinition["prescriptions"][number]["establishmentId"]) {
  return establishments.find((item) => item !== excluded) ?? "cesfam-bellavista";
}

function challengeForSeed(seed: number, competency: ReinforcementCompetency) {
  const challenges = reinforcementChallengeKeys[competency];
  return challenges[seededIndex(seed + 389, challenges.length)];
}

function challengeDrawerIdForSeed(seed: number) {
  return seededIndex(seed + 521, 2) === 0 ? "drawer-primary" : "drawer-secondary";
}

function visualContextKeyForSeed(seed: number) {
  const facility = establishmentForSeed(seed);
  return `${facility}:${challengeDrawerIdForSeed(seed)}`;
}

export function reinforcementVariantForSeed(
  seed: number,
  competency: ReinforcementCompetency,
): ReinforcementVariantFingerprint {
  const patient = patientForSeed(seed);
  const presentation = presentationForCompetency(seed, competency);
  return {
    patientId: patient.id,
    medicationId: presentation.medicationId,
    presentationId: presentation.id,
    establishmentId: establishmentForSeed(seed),
    challengeKey: challengeForSeed(seed, competency),
    drawerId: challengeDrawerIdForSeed(seed),
    visualContextKey: visualContextKeyForSeed(seed),
  };
}

export function baselineContextForSeed(seed: number): ReinforcementVariantFingerprint {
  const patient = patientForSeed(seed);
  const presentation = presentationFromPool(seed + 31, generalPresentationPool);
  return {
    patientId: patient.id,
    medicationId: presentation.medicationId,
    presentationId: presentation.id,
    establishmentId: establishmentForSeed(seed),
    challengeKey: "baseline",
    drawerId: challengeDrawerIdForSeed(seed),
    visualContextKey: visualContextKeyForSeed(seed),
  };
}

function presentationLabel(presentation: MedicationPresentation) {
  return `${presentation.medicationName.toUpperCase()} ${presentation.strength} · ${presentation.pharmaceuticalForm}`;
}

function differentPresentation(
  seed: number,
  excludedMedicationIds: Set<string>,
  pool: MedicationPresentation[] = generalPresentationPool,
) {
  for (let offset = 1; offset <= pool.length; offset += 1) {
    const candidate = pool[seededIndex(seed + offset * 131, pool.length)];
    if (!excludedMedicationIds.has(candidate.medicationId)) return candidate;
  }
  return pool[0];
}

function trainingQuantity(presentation: MedicationPresentation, seed: number) {
  const unit = presentation.dispensingUnit?.toUpperCase();
  if (["CM", "CP", "CA"].includes(unit ?? "")) {
    return [28, 30, 60][seededIndex(seed + 47, 3)];
  }
  if (["FC", "AM", "TU", "UN"].includes(unit ?? "")) return 1;
  return [1, 5, 10][seededIndex(seed + 53, 3)];
}

function wrongSuggestedQuantity(expected: number) {
  return expected === 1 ? 2 : expected + Math.max(1, Math.round(expected / 2));
}

function similarIdentity(patient: ScenarioDefinition["patient"], seed: number) {
  const suffix = String((seed % 899999) + 100000).padStart(6, "0");
  return {
    ...patient,
    id: `${patient.id}-similar-${seed.toString(36)}`,
    maternalSurname: patient.maternalSurname === "Soto" ? "Solís" : "Soto",
    rut: `99.${suffix.slice(0, 3)}.${suffix.slice(3)}-1`,
    age: Math.max(18, patient.age - 2),
  };
}

function buildNormalContext(id: string, seed: number) {
  const patient = patientForSeed(seed);
  const primary = presentationFromPool(seed + 101, generalPresentationPool);
  const secondary = differentPresentation(seed + 211, new Set([primary.medicationId]));
  const historicalPresentation = differentPresentation(
    seed + 419,
    new Set([primary.medicationId, secondary.medicationId]),
  );
  const activeFacilityId = establishmentForSeed(seed);
  const backgroundFacilityId = differentEstablishment(activeFacilityId);

  const currentA = {
    ...scenario001.prescriptions[0],
    patientId: patient.id,
    establishmentId: activeFacilityId,
    status: "accepted" as const,
    lines: [{
      ...scenario001.prescriptions[0].lines[0],
      id: `line-primary:${id}`,
      medicationPresentationId: primary.id,
      quantity: trainingQuantity(primary, seed),
    }],
  };
  const currentB = {
    ...scenario001.prescriptions[1],
    patientId: patient.id,
    establishmentId: activeFacilityId,
    status: "sent" as const,
    lines: [{
      ...scenario001.prescriptions[1].lines[0],
      id: `line-secondary:${id}`,
      medicationPresentationId: secondary.id,
      quantity: trainingQuantity(secondary, seed + 1),
    }],
  };
  const historical = {
    ...scenario001.prescriptions[2],
    patientId: patient.id,
    establishmentId: backgroundFacilityId,
    status: "historical" as const,
    lines: [{
      ...scenario001.prescriptions[2].lines[0],
      id: `line-history:${id}`,
      medicationPresentationId: historicalPresentation.id,
      quantity: trainingQuantity(historicalPresentation, seed + 2),
    }],
  };

  return {
    activeFacilityId,
    patient,
    similarPatients: [similarIdentity(patient, seed + 701)],
    prescriptions: [currentA, currentB, historical],
    relevantPrescriptionIds: [currentA.id, currentB.id],
    drawers: [
      {
        ...scenario001.drawers[0],
        id: `drawer-primary:${id}`,
        expectedMedicationPresentationId: primary.id,
        expectedLabel: presentationLabel(primary),
        displayedLabel: presentationLabel(primary),
        contents: [primary.id],
      },
      {
        ...scenario001.drawers[1],
        id: `drawer-secondary:${id}`,
        expectedMedicationPresentationId: secondary.id,
        expectedLabel: presentationLabel(secondary),
        displayedLabel: presentationLabel(secondary),
        contents: [secondary.id],
      },
    ],
    initialClinicalSystemState: "clean_search" as const,
    suggestedPreparationQuantityByLineId: undefined,
    reinforcementInstructionFocusSection: undefined,
    reinforcementChallengeKey: undefined,
  };
}

function reinforcementContext(id: string, seed: number, competency: ReinforcementCompetency) {
  const variant = reinforcementVariantForSeed(seed, competency);
  const patient = syntheticPatients.find((item) => item.id === variant.patientId) ?? patientForSeed(seed);
  const selectedPresentation = scenario001.arsenal.find((item) => item.id === variant.presentationId)
    ?? presentationForCompetency(seed, competency);
  const otherPresentation = differentPresentation(seed + 211, new Set([selectedPresentation.medicationId]));
  const thirdPresentation = differentPresentation(
    seed + 419,
    new Set([selectedPresentation.medicationId, otherPresentation.medicationId]),
  );
  const activeFacilityId = variant.establishmentId;
  const backgroundFacilityId = differentEstablishment(activeFacilityId);
  const challengeOnPrimary = variant.drawerId === "drawer-primary";
  const primaryPresentation = challengeOnPrimary ? selectedPresentation : otherPresentation;
  const secondaryPresentation = challengeOnPrimary ? otherPresentation : selectedPresentation;
  const primaryQuantity = trainingQuantity(primaryPresentation, seed);
  const secondaryQuantity = trainingQuantity(secondaryPresentation, seed + 1);

  const currentA = {
    ...scenario001.prescriptions[0],
    patientId: patient.id,
    establishmentId: activeFacilityId,
    status: variant.challengeKey === "prescription-pending-status" ? "pending" as const : "accepted" as const,
    lines: [{
      ...scenario001.prescriptions[0].lines[0],
      id: `line-primary:${id}`,
      medicationPresentationId: primaryPresentation.id,
      quantity: primaryQuantity,
    }],
  };
  const currentB = {
    ...scenario001.prescriptions[1],
    patientId: patient.id,
    establishmentId: activeFacilityId,
    status: "sent" as const,
    lines: [{
      ...scenario001.prescriptions[1].lines[0],
      id: `line-secondary:${id}`,
      medicationPresentationId: secondaryPresentation.id,
      quantity: secondaryQuantity,
    }],
  };
  const challengeCurrentRecord = challengeOnPrimary ? currentA : currentB;
  const challengeCurrentLine = challengeCurrentRecord.lines[0];
  const historicalUsesChallenge = [
    "prescription-historical-lookalike",
    "prescription-multiple-establishments",
  ].includes(variant.challengeKey);
  const historical = {
    ...scenario001.prescriptions[2],
    patientId: patient.id,
    establishmentId: variant.challengeKey === "prescription-historical-lookalike"
      ? activeFacilityId
      : backgroundFacilityId,
    status: variant.challengeKey === "prescription-multiple-establishments"
      ? "dispensed" as const
      : "historical" as const,
    dates: {
      ...scenario001.prescriptions[2].dates,
      issuedAt: "2025-11-10",
      dispatchedAt: "2025-11-12",
    },
    lines: [{
      ...scenario001.prescriptions[2].lines[0],
      id: `line-history:${id}`,
      medicationPresentationId: historicalUsesChallenge ? selectedPresentation.id : thirdPresentation.id,
      quantity: historicalUsesChallenge
        ? challengeCurrentLine.quantity
        : trainingQuantity(thirdPresentation, seed + 2),
    }],
    apparentlyDuplicateOf: variant.challengeKey === "prescription-historical-lookalike"
      ? challengeCurrentRecord.id
      : undefined,
  };

  const primaryDrawerContents = [primaryPresentation.id];
  const secondaryDrawerContents = [secondaryPresentation.id];
  const challengeDrawerContents = challengeOnPrimary ? primaryDrawerContents : secondaryDrawerContents;
  if (variant.challengeKey === "preparation-wrong-strength") {
    const alternative = alternativeStrengthPresentations(selectedPresentation.id).find(
      (candidate) => candidate.pharmaceuticalForm === selectedPresentation.pharmaceuticalForm,
    );
    if (alternative) challengeDrawerContents.push(alternative.id);
  }
  if (variant.challengeKey === "preparation-wrong-product") {
    const distractor = challengeOnPrimary ? secondaryPresentation.id : primaryPresentation.id;
    challengeDrawerContents.push(distractor);
  }

  const firstSimilar = similarIdentity(patient, seed + 701);
  const secondSimilar = similarIdentity(patient, seed + 1701);
  let similarPatients = [firstSimilar];
  if (variant.challengeKey === "patient-ambiguous-context") {
    similarPatients = [firstSimilar, secondSimilar];
  }
  if (variant.challengeKey === "final-handoff-recheck") {
    similarPatients = [];
  }

  const initialClinicalSystemState = [
    "patient-previous-record",
    "patient-ambiguous-context",
    "final-previous-record",
  ].includes(variant.challengeKey)
    ? "previous_patient_open" as const
    : "clean_search" as const;

  const suggestedPreparationQuantityByLineId = variant.challengeKey === "preparation-wrong-quantity"
    ? { [challengeCurrentLine.id]: wrongSuggestedQuantity(challengeCurrentLine.quantity) }
    : undefined;

  return {
    activeFacilityId,
    patient,
    similarPatients,
    prescriptions: [currentA, currentB, historical],
    relevantPrescriptionIds: [currentA.id, currentB.id],
    drawers: [
      {
        ...scenario001.drawers[0],
        id: `drawer-primary:${id}`,
        expectedMedicationPresentationId: primaryPresentation.id,
        expectedLabel: presentationLabel(primaryPresentation),
        displayedLabel: presentationLabel(primaryPresentation),
        contents: primaryDrawerContents,
      },
      {
        ...scenario001.drawers[1],
        id: `drawer-secondary:${id}`,
        expectedMedicationPresentationId: secondaryPresentation.id,
        expectedLabel: presentationLabel(secondaryPresentation),
        displayedLabel: presentationLabel(secondaryPresentation),
        contents: secondaryDrawerContents,
      },
    ],
    initialClinicalSystemState,
    suggestedPreparationQuantityByLineId,
    reinforcementInstructionFocusSection: instructionSectionByChallenge[variant.challengeKey],
    reinforcementChallengeKey: variant.challengeKey,
  };
}

export type ScenarioGenerationOptions = {
  id: string;
  mode: SimulationMode;
  seed?: number;
  reinforcementCompetency?: ReinforcementCompetency;
};

export function generateScenarioDefinition({
  id,
  mode,
  seed: providedSeed,
  reinforcementCompetency,
}: ScenarioGenerationOptions): ScenarioDefinition {
  const base = structuredClone(scenario001);
  const runtimeDescriptor = runtimeScenarioDescriptor(id);
  const seed = providedSeed ?? runtimeDescriptor?.seed ?? hashSeed(id);
  const resolvedCompetency = reinforcementCompetency ?? runtimeDescriptor?.competency;
  const context = resolvedCompetency
    ? reinforcementContext(id, seed, resolvedCompetency)
    : buildNormalContext(id, seed);

  if (
    runtimeDescriptor?.kind === "pilot"
    && runtimeDescriptor.challengeKey
    && context.reinforcementChallengeKey !== runtimeDescriptor.challengeKey
  ) {
    throw new Error(
      `Pilot runtime id expected ${runtimeDescriptor.challengeKey} but seed ${seed} generated ${context.reinforcementChallengeKey ?? "none"}`,
    );
  }

  const patient = context.patient;
  const corePrescriptions = context.prescriptions.map((record) => ({ ...record, patientId: patient.id }));
  const recordTarget = mode === "guided" ? 3 : mode === "practice" ? 5 : 12;

  const prescriptions = Array.from({ length: recordTarget }, (_, index) => {
    if (index < corePrescriptions.length) return corePrescriptions[index];
    const template = corePrescriptions[index % corePrescriptions.length];
    const recordId = `generated-record-${index + 1}`;
    const extraPresentation = presentationFromPool(seed + index * 977, generalPresentationPool);
    return {
      ...template,
      id: recordId,
      establishmentId: establishments[seededIndex(seed + index * 13, establishments.length)],
      status: statuses[seededIndex(seed + index * 7, statuses.length)],
      dates: {
        ...template.dates,
        issuedAt: `202${4 + (index % 3)}-${String((index % 12) + 1).padStart(2, "0")}-10`,
      },
      apparentlyDuplicateOf: index % 4 === 0 ? corePrescriptions[0].id : undefined,
      lines: [{
        ...template.lines[0],
        id: `${recordId}:line-1`,
        medicationPresentationId: extraPresentation.id,
        quantity: trainingQuantity(extraPresentation, seed + index),
      }],
    };
  });

  const visibleClinicalRecordIds = prescriptions.map((record) => record.id);
  const availablePrescriptionIds = prescriptions
    .filter((record) => !["historical", "rejected", "completed", "dispensed"].includes(record.status))
    .map((record) => record.id);
  const relevantSource = new Set(context.relevantPrescriptionIds);
  const prescriptionsRelevantToCurrentWithdrawal = prescriptions
    .filter((record) =>
      relevantSource.has(record.id)
      && availablePrescriptionIds.includes(record.id)
      && record.establishmentId === context.activeFacilityId,
    )
    .map((record) => record.id);

  return assertValidScenarioDefinition({
    ...base,
    id,
    version: resolvedCompetency ? "2.8.0-reinforcement" : "2.8.0-generated",
    seed,
    mode,
    patient,
    similarPatients: context.similarPatients,
    activeDispensingFacilityId: context.activeFacilityId,
    requiredPlayerRole: requiredRoleForCompetency(resolvedCompetency),
    reinforcementChallengeKey: context.reinforcementChallengeKey,
    reinforcementInstructionFocusSection: context.reinforcementInstructionFocusSection,
    suggestedPreparationQuantityByLineId: context.suggestedPreparationQuantityByLineId,
    prescriptions,
    visibleClinicalRecordIds,
    availablePrescriptionIds,
    prescriptionsRelevantToCurrentWithdrawal,
    drawers: context.drawers,
    initialClinicalSystemState: context.initialClinicalSystemState,
    initialTray: {
      ...base.initialTray,
      id: `tray:${id}`,
      patientId: patient.id,
      status: "empty",
      items: [],
    },
  });
}
