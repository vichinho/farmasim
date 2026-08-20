import type { DispensingCriterionId } from "@/types/training-simulation";

export type SimulationMode = "guided" | "practice" | "assessment";
export type ActorRole = "attention" | "preparation" | "qf-support";
export type ActorController = "participant" | "simulation" | "team";
export type PlayerRole = "tens-1" | "tens-2";
export type PrescriptionDisposition = "proceed" | "hold-for-review";
export type InstructionSection =
  | "purpose"
  | "schedule-administration"
  | "precautions"
  | "qf-escalation";

export type Actor = {
  id: string;
  role: ActorRole;
  controller: ActorController;
  displayName: string;
};

export type PatientIdentity = {
  id: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  rut: string;
  age: number;
};

export type EstablishmentId =
  | "hospital-tome"
  | "hospital-las-higueras"
  | "cesfam-bellavista"
  | "cesfam-alberto-reyes"
  | "cosam"
  | "san-rafael"
  | "penco"
  | "lirquen";

export type PrescriptionStatus =
  | "pending"
  | "accepted"
  | "sent"
  | "dispensed"
  | "completed"
  | "rejected"
  | "historical";

export type PrescriptionDates = {
  issuedAt: string;
  enteredAt?: string;
  pickupAt?: string;
  lastPickupAt?: string;
  dispatchedAt?: string;
  nextPickupAt?: string;
};

export type PrescriptionLine = {
  id: string;
  medicationPresentationId: string;
  quantity: number;
};

export type PrescriptionRecord = {
  id: string;
  patientId: string;
  establishmentId: EstablishmentId;
  status: PrescriptionStatus;
  dates: PrescriptionDates;
  repetition: "yes" | "no" | "review";
  lines: PrescriptionLine[];
  apparentlyDuplicateOf?: string;
};

export type MedicationEducation = {
  purpose: string;
  relevantSchedule?: string;
  foodRelationship?: string;
  administerWith?: string;
  avoid?: string[];
  practicalRecommendation?: string;
  consultQfWhen?: string[];
};

export type MedicationPresentation = {
  id: string;
  medicationId: string;
  medicationName: string;
  strength: string;
  pharmaceuticalForm: string;
  packageQuantity?: number;
  careSetting?: "atencion-abierta" | "other";
  sourceCode?: string;
  sourceDescription?: string;
  dispensingUnit?: string;
  education?: MedicationEducation;
};

export type DrawerPhysicalCondition =
  | "normal"
  | "damaged-label"
  | "missing-strength"
  | "double-label";
export type DrawerStockState = "available" | "low" | "out-of-stock";

export type Drawer = {
  id: string;
  sectorId: string;
  expectedMedicationPresentationId: string;
  expectedLabel: string;
  displayedLabel: string;
  physicalCondition: DrawerPhysicalCondition;
  stockState: DrawerStockState;
  contents: string[];
};

export type StorageDeviationKind =
  | "mixed-product"
  | "mixed-strength"
  | "mixed-form"
  | "incorrect-label"
  | "incomplete-label"
  | "double-label"
  | "deterioration"
  | "out-of-stock";

export type StorageDeviation = {
  id: string;
  drawerId: string;
  kind: StorageDeviationKind;
  expected: string;
  actual: string;
  medicationPresentationId?: string;
};

export type TrayItem = {
  id: string;
  prescriptionLineId?: string;
  medicationPresentationId: string;
  quantity: number;
};

export type Tray = {
  id: string;
  patientId: string;
  items: TrayItem[];
  status: "empty" | "preparing" | "sent" | "received" | "correction-requested" | "corrected";
};

export type DiscrepancyKind =
  | "patient"
  | "final-patient"
  | "prescription"
  | "prescription-status"
  | "medication"
  | "strength"
  | "pharmaceutical-form"
  | "quantity"
  | "omission"
  | "additional-product";

export type SafetyDiscrepancy = {
  id: string;
  kind: DiscrepancyKind;
  expected: string;
  actual: string;
  prescriptionLineId?: string;
  trayItemId?: string;
};

export type InitialClinicalSystemState = "clean_search" | "previous_patient_open";

export type ScenarioDefinition = {
  id: string;
  version: string;
  seed: number;
  mode: SimulationMode;
  patient: PatientIdentity;
  similarPatients: PatientIdentity[];
  actors: Actor[];
  activeDispensingFacilityId: EstablishmentId;
  requiredPlayerRole?: PlayerRole;
  reinforcementChallengeKey?: string;
  reinforcementInstructionFocusSection?: InstructionSection;
  suggestedPreparationQuantityByLineId?: Record<string, number>;
  prescriptions: PrescriptionRecord[];
  visibleClinicalRecordIds: string[];
  availablePrescriptionIds: string[];
  prescriptionsRelevantToCurrentWithdrawal: string[];
  arsenal: MedicationPresentation[];
  drawers: Drawer[];
  initialTray: Tray;
  initialClinicalSystemState: InitialClinicalSystemState;
  educationalSourceIds: string[];
};

export type SimulationEventType =
  | "document.requested"
  | "document.opened"
  | "computer.focused"
  | "rut.typed"
  | "search.executed"
  | "patient_record.opened"
  | "tab.opened"
  | "record.scrolled"
  | "prescription.opened"
  | "prescription.closed"
  | "prescription.status_verified"
  | "computer.exited"
  | "storage.focused"
  | "drawer.label_inspected"
  | "drawer.opened"
  | "drawer.contents_inspected"
  | "medication.inspected"
  | "medication.compared_to_prescription"
  | "medication.taken"
  | "medication.returned"
  | "medication.added_to_tray"
  | "tray.sent"
  | "tray.received"
  | "tray.inspected"
  | "tray.corrected"
  | "correction.requested"
  | "identity.rechecked"
  | "instruction.section_given"
  | "instructions.given"
  | "qf_support.requested"
  | "delivery.attempted"
  | "delivery.blocked"
  | "delivery.completed"
  | "patient.focused"
  | "preparation.focused"
  | "scene.returned"
  | "role.selected";

export type SimulationEvent = {
  id: string;
  sequence: number;
  occurredAt: string;
  actorId: string;
  type: SimulationEventType;
  data: Record<string, string | number | boolean | string[] | undefined>;
};

export type CriterionStatus = "pending" | "met" | "reinforcement" | "intercepted";

export type SimulationSession = {
  id: string;
  scenarioId: string;
  scenarioVersion: string;
  seed: number;
  mode: SimulationMode;
  activeActorId: string;
  selectedPlayerRole: PlayerRole | null;
  actorControllers: Record<string, ActorController>;
  focusedObjectId: string | null;
  focusReturnObjectId: string | null;
  typedRut: string;
  loadedPatientId: string | null;
  finalReidentifiedPatientId: string | null;
  openedPrescriptionIds: string[];
  verifiedPrescriptionIds: string[];
  prescriptionDispositionById: Record<string, PrescriptionDisposition>;
  inspectedMedicationIds: string[];
  comparedPrescriptionLineIds: string[];
  instructionEvidenceKeys: string[];
  missingInstructionSections: InstructionSection[];
  openedTabIds: string[];
  scrolledRecordIds: string[];
  tray: Tray;
  eventLog: SimulationEvent[];
  discrepancies: SafetyDiscrepancy[];
  storageDeviations: StorageDeviation[];
  criteria: Record<DispensingCriterionId, CriterionStatus>;
  deliveryStatus: "not-attempted" | "blocked" | "completed" | "safely-stopped";
  startedAt: string;
  updatedAt: string;
};

export type SimulationCommand = {
  type: SimulationEventType;
  actorId: string;
  data?: SimulationEvent["data"];
};