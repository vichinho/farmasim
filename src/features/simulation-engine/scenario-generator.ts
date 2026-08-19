import { alternativeStrengthPresentations } from "@/data/simulation/arsenal";
import { scenario001 } from "@/data/simulation/scenario-001";
import type { MedicationPresentation, ScenarioDefinition, SimulationMode } from "./types";
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
    "instructions-single-medication",
    "instructions-multiple-medications",
    "instructions-changed-presentation",
  ],
};

const knownReinforcementCompetencies = new Set<ReinforcementCompetency>([
  "patient-identification",
  "prescription-review",
  "preparation-comparison",
  "final-identification",
  "instructions",
]);

function competencyFromReinforcementId(id: string) {
  if (!id.startsWith("reinforcement__")) return undefined;
  const competency = id.split("__")[1] as ReinforcementCompetency | undefined;
  return competency && knownReinforcementCompetencies.has(competency) ? competency : undefined;
}

const reinforcementPresentationPool = scenario001.arsenal.filter((presentation) => {
  const oralSolid = ["COMPRIMIDO ORAL", "CAPSULA ORAL", "GRAGEA"].includes(presentation.pharmaceuticalForm);
  const hasStrength = !presentation.strength.startsWith("NO ESPECIFICADA");
  const hasAlternativeStrength = alternativeStrengthPresentations(presentation.id).some(
    (candidate) => candidate.pharmaceuticalForm === presentation.pharmaceuticalForm,
  );
  return oralSolid && hasStrength && hasAlternativeStrength;
});

function patientForSeed(seed: number) {
  return syntheticPatients[seededIndex(seed + 17, syntheticPatients.length)];
}

function presentationForSeed(seed: number) {
  if (!reinforcementPresentationPool.length) {
    throw new Error("Atención Abierta arsenal has no oral solid presentation with a real alternative strength");
  }
  return reinforcementPresentationPool[seededIndex(seed + 97, reinforcementPresentationPool.length)];
}

function establishmentForSeed(seed: number) {
  return establishments[seededIndex(seed + 193, establishments.length)];
}

function challengeForSeed(seed: number, competency: ReinforcementCompetency) {
  const challenges = reinforcementChallengeKeys[competency];
  return challenges[seededIndex(seed + 389, challenges.length)];
}

export function reinforcementVariantForSeed(
  seed: number,
  competency: ReinforcementCompetency,
): ReinforcementVariantFingerprint {
  const patient = patientForSeed(seed);
  const presentation = presentationForSeed(seed);
  return {
    patientId: patient.id,
    medicationId: presentation.medicationId,
    presentationId: presentation.id,
    establishmentId: establishmentForSeed(seed),
    challengeKey: challengeForSeed(seed, competency),
  };
}

export function baselineContextForSeed(seed: number): ReinforcementVariantFingerprint {
  const patient = syntheticPatients[seededIndex(seed, 3)];
  const presentation = scenario001.arsenal.find((item) => item.id === "trakcare-004-0137") ?? scenario001.arsenal[0];
  return {
    patientId: patient.id,
    medicationId: presentation.medicationId,
    presentationId: presentation.id,
    establishmentId: "hospital-tome",
    challengeKey: "baseline",
  };
}

function presentationLabel(presentation: MedicationPresentation) {
  return `${presentation.medicationName.toUpperCase()} ${presentation.strength} · ${presentation.pharmaceuticalForm}`;
}

function differentPresentation(seed: number, excludedMedicationIds: Set<string>) {
  for (let offset = 1; offset <= reinforcementPresentationPool.length; offset += 1) {
    const candidate = reinforcementPresentationPool[
      seededIndex(seed + offset * 131, reinforcementPresentationPool.length)
    ];
    if (!excludedMedicationIds.has(candidate.medicationId)) return candidate;
  }
  return reinforcementPresentationPool[0];
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

function reinforcementContext(id: string, seed: number, competency: ReinforcementCompetency) {
  const variant = reinforcementVariantForSeed(seed, competency);
  const patient = syntheticPatients.find((item) => item.id === variant.patientId) ?? patientForSeed(seed);
  const selectedPresentation = scenario001.arsenal.find((item) => item.id === variant.presentationId) ?? presentationForSeed(seed);
  const secondPresentation = differentPresentation(seed + 211, new Set([selectedPresentation.medicationId]));
  const thirdPresentation = differentPresentation(seed + 419, new Set([selectedPresentation.medicationId, secondPresentation.medicationId]));
  const secondEstablishment = establishments.find((item) => item !== variant.establishmentId) ?? "cesfam-bellavista";

  const currentA = {
    ...scenario001.prescriptions[0],
    patientId: patient.id,
    establishmentId: variant.establishmentId,
    status: variant.challengeKey === "prescription-pending-status" ? "pending" as const : "accepted" as const,
    lines: [{
      ...scenario001.prescriptions[0].lines[0],
      id: `line-primary:${id}`,
      medicationPresentationId: selectedPresentation.id,
      quantity: 30,
    }],
  };
  const currentB = {
    ...scenario001.prescriptions[1],
    patientId: patient.id,
    establishmentId: secondEstablishment,
    status: "sent" as const,
    lines: [{
      ...scenario001.prescriptions[1].lines[0],
      id: `line-secondary:${id}`,
      medicationPresentationId: secondPresentation.id,
      quantity: 30,
    }],
  };
  const historical = {
    ...scenario001.prescriptions[2],
    patientId: patient.id,
    lines: [{
      ...scenario001.prescriptions[2].lines[0],
      id: `line-history:${id}`,
      medicationPresentationId: variant.challengeKey === "prescription-historical-lookalike"
        ? selectedPresentation.id
        : thirdPresentation.id,
      quantity: 20,
    }],
    apparentlyDuplicateOf: variant.challengeKey === "prescription-historical-lookalike" ? currentA.id : undefined,
  };

  const primaryDrawerContents = [selectedPresentation.id];
  if (variant.challengeKey === "preparation-wrong-strength") {
    const alternative = alternativeStrengthPresentations(selectedPresentation.id).find(
      (candidate) => candidate.pharmaceuticalForm === selectedPresentation.pharmaceuticalForm,
    );
    if (alternative) primaryDrawerContents.push(alternative.id);
  }
  if (variant.challengeKey === "preparation-wrong-product") primaryDrawerContents.push(secondPresentation.id);

  const relevantPrescriptionIds = variant.challengeKey === "instructions-single-medication"
    ? [currentA.id]
    : [currentA.id, currentB.id];

  return {
    patient,
    similarPatients: [similarIdentity(patient, seed), ...scenario001.similarPatients.filter((item) => item.id !== patient.id)],
    prescriptions: [currentA, currentB, historical],
    relevantPrescriptionIds,
    drawers: [
      {
        ...scenario001.drawers[0],
        id: `drawer-primary:${id}`,
        expectedMedicationPresentationId: selectedPresentation.id,
        expectedLabel: presentationLabel(selectedPresentation),
        displayedLabel: presentationLabel(selectedPresentation),
        contents: primaryDrawerContents,
      },
      {
        ...scenario001.drawers[1],
        id: `drawer-secondary:${id}`,
        expectedMedicationPresentationId: secondPresentation.id,
        expectedLabel: presentationLabel(secondPresentation),
        displayedLabel: presentationLabel(secondPresentation),
        contents: [secondPresentation.id],
      },
    ],
    initialClinicalSystemState: [
      "patient-previous-record",
      "patient-similar-identity",
      "final-similar-identity",
      "final-previous-record",
    ].includes(variant.challengeKey)
      ? "previous_patient_open" as const
      : "clean_search" as const,
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
  seed = hashSeed(id),
  reinforcementCompetency,
}: ScenarioGenerationOptions): ScenarioDefinition {
  const base = structuredClone(scenario001);
  const resolvedCompetency = reinforcementCompetency ?? competencyFromReinforcementId(id);
  const reinforcement = resolvedCompetency
    ? reinforcementContext(id, seed, resolvedCompetency)
    : null;

  const patient = reinforcement?.patient ?? syntheticPatients[seededIndex(seed, 3)];
  const corePrescriptions = (reinforcement?.prescriptions ?? base.prescriptions)
    .map((record) => ({ ...record, patientId: patient.id }));
  const recordTarget = mode === "guided" ? 3 : mode === "practice" ? 5 : 12;

  const prescriptions = Array.from({ length: recordTarget }, (_, index) => {
    if (index < corePrescriptions.length) return corePrescriptions[index];
    const template = corePrescriptions[index % corePrescriptions.length];
    const recordId = `generated-record-${index + 1}`;
    return {
      ...template,
      id: recordId,
      establishmentId: establishments[seededIndex(seed + index, establishments.length)],
      status: statuses[seededIndex(seed + index * 7, statuses.length)],
      dates: {
        ...template.dates,
        issuedAt: `202${4 + (index % 3)}-${String((index % 12) + 1).padStart(2, "0")}-10`,
      },
      apparentlyDuplicateOf: index % 4 === 0 ? corePrescriptions[0].id : undefined,
      lines: template.lines.map((line) => ({ ...line, id: `${recordId}:${line.id}` })),
    };
  });

  const visibleClinicalRecordIds = prescriptions.map((record) => record.id);
  const availablePrescriptionIds = prescriptions
    .filter((record) => !["historical", "rejected", "completed", "dispensed"].includes(record.status))
    .map((record) => record.id);
  const relevantSource = new Set(
    reinforcement?.relevantPrescriptionIds ?? base.prescriptionsRelevantToCurrentWithdrawal,
  );
  const prescriptionsRelevantToCurrentWithdrawal = prescriptions
    .filter((record) => relevantSource.has(record.id) && availablePrescriptionIds.includes(record.id))
    .map((record) => record.id);

  return assertValidScenarioDefinition({
    ...base,
    id,
    version: resolvedCompetency ? "2.3.0-reinforcement" : "2.2.0-generated",
    seed,
    mode,
    patient,
    similarPatients: reinforcement?.similarPatients ?? base.similarPatients,
    prescriptions,
    visibleClinicalRecordIds,
    availablePrescriptionIds,
    prescriptionsRelevantToCurrentWithdrawal,
    drawers: reinforcement?.drawers ?? base.drawers,
    initialClinicalSystemState: reinforcement?.initialClinicalSystemState ?? base.initialClinicalSystemState,
    initialTray: {
      ...base.initialTray,
      id: `tray:${id}`,
      patientId: patient.id,
      status: "empty",
      items: [],
    },
  });
}
