import type { DispensingCriterionId } from "@/types/training-simulation";

export type GameMode = "guided" | "practice" | "assessment";
export type SimulationRole = "attention" | "preparation";
export type ActorController = "simulation" | "player_1" | "player_2";

export type Actor = {
  id: string;
  role: SimulationRole;
  controller: ActorController;
};

export type SyntheticPatient = {
  id: string;
  firstName: string;
  lastName1: string;
  lastName2: string;
  syntheticRut: string;
  age: number;
};

export type HealthcareFacility = {
  id: string;
  name: string;
  type: "hospital" | "cesfam" | "cosam" | "other";
};

export type MedicationPresentation = {
  id: string;
  medicationId: string;
  genericName: string;
  strength: string;
  pharmaceuticalForm: string;
  packageQuantity: number;
};

export type PrescriptionStatus =
  | "pending"
  | "accepted"
  | "sent"
  | "dispensed"
  | "completed"
  | "rejected"
  | "historical";

export type RepetitionStatus = "yes" | "no" | "review";

export type Prescription = {
  id: string;
  presentationId: string;
  quantity: number;
  status: PrescriptionStatus;
  facilityId: string;
  relevantForCurrentWithdrawal: boolean;
  issuedAt?: string;
  admittedAt?: string;
  withdrawalDate?: string;
  lastWithdrawalDate?: string;
  dispatchDate?: string;
  nextWithdrawalDate?: string;
  repetitionStatus: RepetitionStatus;
};

export type ClinicalRecord = {
  id: string;
  patientId: string;
  facilityId: string;
  prescriptionIds: string[];
};

export type DrawerPhysicalCondition =
  | "good"
  | "damaged-label"
  | "missing-strength"
  | "overlapping-labels";

export type DrawerStockState = "available" | "low" | "out-of-stock";

export type DrawerContentPosition = {
  row: number;
  column: number;
  depth: number;
};

export type DrawerContentItem = {
  id: string;
  presentationId: string;
  quantity: number;
  position: DrawerContentPosition;
};

export type Drawer = {
  id: string;
  sectorId: string;
  expectedMedicationPresentationId?: string;
  expectedLabel: string;
  displayedLabel: string;
  physicalCondition: DrawerPhysicalCondition;
  stockState: DrawerStockState;
  contents: DrawerContentItem[];
};

export type PreparationItem = {
  presentationId: string;
  quantity: number;
};

export type Preparation = {
  requestedItems: PreparationItem[];
  preparedItems: PreparationItem[];
  preparedBy: string;
  createdAt: string;
  status: "pending" | "prepared" | "sent" | "received" | "confirmed";
};

export type InitialClinicalSystemState =
  | { type: "clean_search" }
  | { type: "previous_patient_open"; patientId: string }
  | { type: "previous_tab_open"; patientId: string; tabId: string }
  | { type: "previous_prescription_open"; patientId: string; prescriptionId: string };

export type CompetencyId =
  | "identity_verification"
  | "record_review"
  | "verify_medication"
  | "verify_strength"
  | "verify_form"
  | "verify_quantity"
  | "storage_check"
  | "double_check_performed"
  | "instructions"
  | "qf_escalation";

export type ScenarioType =
  | "correct_attention"
  | "concentration_error"
  | "incomplete_prescription_review"
  | "wrong_patient_context"
  | "storage_label_and_mixed_contents";

export type ScenarioDefinition = {
  id: string;
  version: number;
  type: ScenarioType;
  difficulty: "initial" | "medium" | "high" | "expert";
  competencyTargets: CompetencyId[];
  allowedRoles: SimulationRole[];
  allowedModes: GameMode[];
  errorCountRange: { min: number; max: number };
  protocolRules?: {
    continuablePrescriptionStatuses?: PrescriptionStatus[];
  };
};

export type SimulationSession = {
  id: string;
  schemaVersion: number;
  seed: string;
  scenarioDefinitionId: string;
  scenarioDefinitionVersion: number;
  generatedAt: string;
  mode: GameMode;
  playerRole: SimulationRole;
  actors: Actor[];
  patientId: string;
  patients: SyntheticPatient[];
  facilities: HealthcareFacility[];
  presentations: MedicationPresentation[];
  records: ClinicalRecord[];
  prescriptions: Prescription[];
  drawers: Drawer[];
  preparation: Preparation;
  initialClinicalSystemState: InitialClinicalSystemState;
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
  | "computer.exited"
  | "storage.entered"
  | "drawer.label_inspected"
  | "drawer.opened"
  | "drawer.contents_inspected"
  | "medication.inspected"
  | "medication.taken"
  | "medication.returned"
  | "medication.added_to_tray"
  | "tray.sent"
  | "tray.received"
  | "tray.inspected"
  | "preparation.confirmed"
  | "correction.requested"
  | "identity.rechecked"
  | "instructions.given"
  | "qf_support.requested"
  | "delivery.attempted"
  | "delivery.blocked"
  | "delivery.completed";

export type SimulationEvent = {
  id: string;
  sessionId: string;
  sequence: number;
  timestamp: string;
  actorId: string;
  type: SimulationEventType;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

export type SimulationState = {
  activePatientId: string | null;
  openedRecordIds: string[];
  openedPrescriptionIds: string[];
  inspectedMedicationItemIds: string[];
  openedDrawerIds: string[];
  trayInspected: boolean;
  deliveryAttempted: boolean;
  qfSupportRequested: boolean;
};

export type ProcessCriterionStatus =
  | "met"
  | "missed"
  | "intercepted"
  | "requires-review"
  | "not-applicable";

export type ProcessCriterionResult = {
  criterionId: DispensingCriterionId;
  status: ProcessCriterionStatus;
  evidenceEventIds: string[];
};

export type CompetencyResult = {
  competencyId: CompetencyId;
  status: "met" | "missed" | "not-observed";
  evidenceEventIds: string[];
};

export type ProcessDeviation = {
  id: string;
  type: string;
  stage: string;
  actorId?: string;
  evidenceEventIds: string[];
};

export type MedicationDiscrepancyType =
  | "wrong_patient"
  | "wrong_medication"
  | "wrong_strength"
  | "wrong_form"
  | "wrong_quantity"
  | "omission"
  | "extra_product";

export type MedicationDiscrepancyStatus =
  | "active"
  | "detected"
  | "corrected"
  | "intercepted"
  | "resolved";

export type MedicationDiscrepancy = {
  id: string;
  type: MedicationDiscrepancyType;
  originStage: string;
  createdBy?: string;
  expected?: Record<string, unknown>;
  actual?: Record<string, unknown>;
  status: MedicationDiscrepancyStatus;
  detectedAt?: string;
  detectedBy?: string;
  interceptedByBarrierId?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  reachedPatient: boolean;
};

export type DiscrepancyTransition = {
  discrepancyId: string;
  from: MedicationDiscrepancyStatus;
  to: MedicationDiscrepancyStatus;
  stage: string;
  actorId?: string;
  barrierId?: string;
};

export type SafetyBarrier = {
  id: string;
  stage: string;
  type: "manual" | "system";
  competencyId?: CompetencyId;
};

export type BarrierExecution = {
  barrierId: string;
  executed: boolean;
  effective: boolean;
  discrepancyIds: string[];
};

export type SafetyBarrierFailure = {
  id: string;
  barrierId: string;
  discrepancyIds: string[];
  evidenceEventIds: string[];
};

export type DeliverySafetyResult = {
  allowed: boolean;
  discrepancies: MedicationDiscrepancy[];
  blockingDiscrepancyIds: string[];
  evaluatedBarriers: BarrierExecution[];
  barrierFailures: SafetyBarrierFailure[];
  discrepancyTransitions: DiscrepancyTransition[];
};

export type ScenarioValidationIssue = {
  code: string;
  message: string;
};

export type ScenarioValidationResult = {
  valid: boolean;
  issues: ScenarioValidationIssue[];
};

export type DeterministicRandom = {
  next: () => number;
  integer: (min: number, max: number) => number;
  pick: <T>(values: readonly T[]) => T;
  chance: (probability: number) => boolean;
};

export type ScenarioGenerationContext = {
  attempt: number;
  seed: string;
  random: DeterministicRandom;
};

export type ScenarioCandidateFactory = (
  context: ScenarioGenerationContext,
) => SimulationSession;

export type ScenarioGenerationResult = {
  session: SimulationSession;
  attempts: number;
};

export type SimulationEvaluation = {
  state: SimulationState;
  criteria: ProcessCriterionResult[];
  competencies: CompetencyResult[];
  processDeviations: ProcessDeviation[];
  safety: DeliverySafetyResult;
};