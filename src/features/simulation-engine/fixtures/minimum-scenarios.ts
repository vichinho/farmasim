import type {
  ScenarioDefinition,
  SimulationEvent,
  SimulationSession,
} from "@/features/simulation-engine/types";

export type MinimumScenarioFixture = {
  id: "A" | "B" | "C" | "D" | "E";
  title: string;
  definition: ScenarioDefinition;
  session: SimulationSession;
  events: SimulationEvent[];
};

const facilities = [
  { id: "facility-tome", name: "Hospital de Tomé", type: "hospital" as const },
  { id: "facility-bellavista", name: "CESFAM Bellavista", type: "cesfam" as const },
];

const patients = [
  {
    id: "patient-marta",
    firstName: "Marta",
    lastName1: "Fuentes",
    lastName2: "Soto",
    syntheticRut: "12.345.678-9",
    age: 58,
  },
  {
    id: "patient-elena",
    firstName: "Elena",
    lastName1: "González",
    lastName2: "Silva",
    syntheticRut: "19.876.543-2",
    age: 61,
  },
];

const presentations = [
  {
    id: "losartan-50",
    medicationId: "losartan",
    genericName: "Losartán",
    strength: "50 mg",
    pharmaceuticalForm: "Comprimido",
    packageQuantity: 30,
  },
  {
    id: "losartan-100",
    medicationId: "losartan",
    genericName: "Losartán",
    strength: "100 mg",
    pharmaceuticalForm: "Comprimido",
    packageQuantity: 30,
  },
  {
    id: "amlodipino-5",
    medicationId: "amlodipino",
    genericName: "Amlodipino",
    strength: "5 mg",
    pharmaceuticalForm: "Comprimido",
    packageQuantity: 30,
  },
  {
    id: "paracetamol-500",
    medicationId: "paracetamol",
    genericName: "Paracetamol",
    strength: "500 mg",
    pharmaceuticalForm: "Comprimido",
    packageQuantity: 20,
  },
];

const basePrescriptions = [
  {
    id: "rx-losartan",
    presentationId: "losartan-50",
    quantity: 1,
    status: "pending" as const,
    facilityId: "facility-tome",
    relevantForCurrentWithdrawal: true,
    issuedAt: "2026-08-01T09:00:00.000Z",
    repetitionStatus: "review" as const,
  },
  {
    id: "rx-amlodipino",
    presentationId: "amlodipino-5",
    quantity: 1,
    status: "pending" as const,
    facilityId: "facility-bellavista",
    relevantForCurrentWithdrawal: true,
    issuedAt: "2026-08-02T09:00:00.000Z",
    repetitionStatus: "review" as const,
  },
  {
    id: "rx-paracetamol",
    presentationId: "paracetamol-500",
    quantity: 1,
    status: "historical" as const,
    facilityId: "facility-tome",
    relevantForCurrentWithdrawal: false,
    issuedAt: "2026-07-01T09:00:00.000Z",
    repetitionStatus: "no" as const,
  },
];

const correctDrawer = {
  id: "drawer-l-01",
  sectorId: "L",
  expectedMedicationPresentationId: "losartan-50",
  expectedLabel: "LOSARTÁN 50 mg",
  displayedLabel: "LOSARTÁN 50 mg",
  physicalCondition: "good" as const,
  stockState: "available" as const,
  contents: [
    {
      id: "drawer-l-01-item-1",
      presentationId: "losartan-50",
      quantity: 6,
      position: { row: 0, column: 0, depth: 0 },
    },
  ],
};

const mixedDrawer = {
  ...correctDrawer,
  id: "drawer-l-mixed",
  displayedLabel: "LOSARTÁN 100 mg",
  contents: [
    {
      id: "drawer-l-mixed-item-1",
      presentationId: "losartan-50",
      quantity: 5,
      position: { row: 0, column: 0, depth: 0 },
    },
    {
      id: "drawer-l-mixed-item-2",
      presentationId: "losartan-100",
      quantity: 1,
      position: { row: 0, column: 1, depth: 1 },
    },
  ],
};

function definition(
  id: ScenarioDefinition["id"],
  type: ScenarioDefinition["type"],
  competencyTargets: ScenarioDefinition["competencyTargets"],
  errorCountRange: ScenarioDefinition["errorCountRange"],
): ScenarioDefinition {
  return {
    id,
    version: 1,
    type,
    difficulty: "medium",
    competencyTargets,
    allowedRoles: ["attention", "preparation"],
    allowedModes: ["guided", "practice", "assessment"],
    errorCountRange,
  };
}

function session(
  id: string,
  scenario: ScenarioDefinition,
  options: {
    playerRole?: SimulationSession["playerRole"];
    initialClinicalSystemState?: SimulationSession["initialClinicalSystemState"];
    prescriptions?: SimulationSession["prescriptions"];
    requestedItems?: SimulationSession["preparation"]["requestedItems"];
    preparedItems?: SimulationSession["preparation"]["preparedItems"];
    drawers?: SimulationSession["drawers"];
  } = {},
): SimulationSession {
  const prescriptions = options.prescriptions ?? basePrescriptions;
  const requestedItems = options.requestedItems ?? [
    { presentationId: "losartan-50", quantity: 1 },
    { presentationId: "amlodipino-5", quantity: 1 },
  ];

  return {
    id,
    schemaVersion: 1,
    seed: `${id}:seed:2026-08-17`,
    scenarioDefinitionId: scenario.id,
    scenarioDefinitionVersion: scenario.version,
    generatedAt: "2026-08-17T20:00:00.000Z",
    mode: "practice",
    playerRole: options.playerRole ?? "attention",
    actors: [
      { id: "actor-attention", role: "attention", controller: options.playerRole === "preparation" ? "simulation" : "player_1" },
      { id: "actor-preparation", role: "preparation", controller: options.playerRole === "preparation" ? "player_1" : "simulation" },
    ],
    patientId: "patient-marta",
    patients,
    facilities,
    presentations,
    records: [
      {
        id: "record-marta",
        patientId: "patient-marta",
        facilityId: "facility-tome",
        prescriptionIds: prescriptions.map((item) => item.id),
      },
      {
        id: "record-elena",
        patientId: "patient-elena",
        facilityId: "facility-bellavista",
        prescriptionIds: [],
      },
    ],
    prescriptions,
    drawers: options.drawers ?? [correctDrawer],
    preparation: {
      requestedItems,
      preparedItems: options.preparedItems ?? requestedItems,
      preparedBy: "actor-preparation",
      createdAt: "2026-08-17T20:05:00.000Z",
      status: "received",
    },
    initialClinicalSystemState: options.initialClinicalSystemState ?? { type: "clean_search" },
  };
}

function events(
  sessionId: string,
  inputs: Array<Omit<SimulationEvent, "id" | "sessionId" | "sequence" | "timestamp">>,
): SimulationEvent[] {
  return inputs.map((input, index) => ({
    ...input,
    id: `${sessionId}:event:${index + 1}`,
    sessionId,
    sequence: index + 1,
    timestamp: new Date(Date.UTC(2026, 7, 17, 20, index, 0)).toISOString(),
  }));
}

function attentionHappyPathEvents(sessionId: string, prescriptionIds: string[], inspectedPresentationIds: string[]) {
  return events(sessionId, [
    { actorId: "actor-attention", type: "document.requested", targetType: "document", targetId: "patient-marta-document" },
    { actorId: "actor-attention", type: "document.opened", targetType: "document", targetId: "patient-marta-document" },
    { actorId: "actor-attention", type: "computer.focused", targetType: "computer", targetId: "clinical-terminal" },
    { actorId: "actor-attention", type: "rut.typed", targetType: "patient", targetId: "patient-marta", metadata: { value: "12.345.678-9" } },
    { actorId: "actor-attention", type: "search.executed", targetType: "patient", metadata: { resultPatientId: "patient-marta" } },
    { actorId: "actor-attention", type: "patient_record.opened", targetType: "record", targetId: "record-marta" },
    ...prescriptionIds.map((targetId) => ({ actorId: "actor-attention", type: "prescription.opened" as const, targetType: "prescription", targetId })),
    { actorId: "actor-attention", type: "computer.exited", targetType: "computer", targetId: "clinical-terminal" },
    { actorId: "actor-attention", type: "tray.received", targetType: "tray", targetId: "tray-1" },
    { actorId: "actor-attention", type: "tray.inspected", targetType: "tray", targetId: "tray-1" },
    ...inspectedPresentationIds.map((targetId) => ({ actorId: "actor-attention", type: "medication.inspected" as const, targetType: "medication", targetId })),
    { actorId: "actor-attention", type: "identity.rechecked", targetType: "patient", targetId: "patient-marta" },
    { actorId: "actor-attention", type: "instructions.given", targetType: "patient", targetId: "patient-marta" },
    { actorId: "actor-attention", type: "delivery.attempted", targetType: "patient", targetId: "patient-marta" },
  ]);
}

const definitionA = definition(
  "minimum-A-correct-attention",
  "correct_attention",
  ["identity_verification", "record_review", "double_check_performed", "instructions"],
  { min: 0, max: 0 },
);
const sessionA = session("session-minimum-A", definitionA);

const definitionB = definition(
  "minimum-B-wrong-strength",
  "concentration_error",
  ["verify_medication", "verify_strength", "double_check_performed"],
  { min: 1, max: 2 },
);
const sessionB = session("session-minimum-B", definitionB, {
  requestedItems: [{ presentationId: "losartan-50", quantity: 1 }],
  preparedItems: [{ presentationId: "losartan-100", quantity: 1 }],
});

const prescriptionsC = basePrescriptions.map((prescription) => ({
  ...prescription,
  relevantForCurrentWithdrawal: true,
  status: "pending" as const,
}));
const definitionC = definition(
  "minimum-C-incomplete-review",
  "incomplete_prescription_review",
  ["record_review"],
  { min: 0, max: 0 },
);
const sessionC = session("session-minimum-C", definitionC, {
  prescriptions: prescriptionsC,
  requestedItems: [
    { presentationId: "losartan-50", quantity: 1 },
    { presentationId: "amlodipino-5", quantity: 1 },
    { presentationId: "paracetamol-500", quantity: 1 },
  ],
});

const definitionD = definition(
  "minimum-D-wrong-patient-context",
  "wrong_patient_context",
  ["identity_verification"],
  { min: 1, max: 1 },
);
const sessionD = session("session-minimum-D", definitionD, {
  initialClinicalSystemState: { type: "previous_patient_open", patientId: "patient-elena" },
});

const definitionE = definition(
  "minimum-E-storage-mismatch",
  "storage_label_and_mixed_contents",
  ["storage_check", "verify_strength"],
  { min: 0, max: 2 },
);
const sessionE = session("session-minimum-E", definitionE, {
  playerRole: "preparation",
  drawers: [mixedDrawer],
  requestedItems: [{ presentationId: "losartan-50", quantity: 1 }],
  preparedItems: [{ presentationId: "losartan-50", quantity: 1 }],
});

export const minimumScenarioFixtures: MinimumScenarioFixture[] = [
  {
    id: "A",
    title: "Atención completamente correcta",
    definition: definitionA,
    session: sessionA,
    events: attentionHappyPathEvents(sessionA.id, ["rx-losartan", "rx-amlodipino"], ["losartan-50", "amlodipino-5"]),
  },
  {
    id: "B",
    title: "Concentración incorrecta",
    definition: definitionB,
    session: sessionB,
    events: attentionHappyPathEvents(sessionB.id, ["rx-losartan", "rx-amlodipino"], ["losartan-100"]),
  },
  {
    id: "C",
    title: "Muchas prescripciones y una no revisada",
    definition: definitionC,
    session: sessionC,
    events: attentionHappyPathEvents(sessionC.id, ["rx-losartan", "rx-amlodipino"], ["losartan-50", "amlodipino-5", "paracetamol-500"]),
  },
  {
    id: "D",
    title: "Ficha/paciente incorrecto",
    definition: definitionD,
    session: sessionD,
    events: events(sessionD.id, [
      { actorId: "actor-attention", type: "document.requested", targetType: "document", targetId: "patient-marta-document" },
      { actorId: "actor-attention", type: "document.opened", targetType: "document", targetId: "patient-marta-document" },
      { actorId: "actor-attention", type: "computer.focused", targetType: "computer", targetId: "clinical-terminal" },
      { actorId: "actor-attention", type: "patient_record.opened", targetType: "record", targetId: "record-elena" },
      { actorId: "actor-attention", type: "tray.inspected", targetType: "tray", targetId: "tray-1" },
      { actorId: "actor-attention", type: "medication.inspected", targetType: "medication", targetId: "losartan-50" },
      { actorId: "actor-attention", type: "medication.inspected", targetType: "medication", targetId: "amlodipino-5" },
      { actorId: "actor-attention", type: "delivery.attempted", targetType: "patient", targetId: "patient-elena" },
    ]),
  },
  {
    id: "E",
    title: "Rótulo incorrecto y medicamentos mezclados",
    definition: definitionE,
    session: sessionE,
    events: events(sessionE.id, [
      { actorId: "actor-preparation", type: "storage.entered", targetType: "storage", targetId: "sector-L" },
      { actorId: "actor-preparation", type: "drawer.label_inspected", targetType: "drawer", targetId: "drawer-l-mixed" },
      { actorId: "actor-preparation", type: "drawer.opened", targetType: "drawer", targetId: "drawer-l-mixed" },
      { actorId: "actor-preparation", type: "drawer.contents_inspected", targetType: "drawer", targetId: "drawer-l-mixed" },
      { actorId: "actor-preparation", type: "medication.inspected", targetType: "medication", targetId: "losartan-50" },
      { actorId: "actor-preparation", type: "medication.taken", targetType: "medication", targetId: "losartan-50" },
      { actorId: "actor-preparation", type: "medication.added_to_tray", targetType: "medication", targetId: "losartan-50" },
      { actorId: "actor-preparation", type: "tray.sent", targetType: "tray", targetId: "tray-1" },
    ]),
  },
];
