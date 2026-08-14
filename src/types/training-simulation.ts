export const PROFESSIONAL_REVIEW_MARKER =
  "[CONTENIDO PENDIENTE DE VALIDACIÓN PROFESIONAL]";

export type ContentValidationStatus =
  | "demonstrative"
  | "pending-professional-review"
  | "professionally-validated";

export type EducationalSourceId =
  | "dispensing-evaluation-rubric-7-criteria"
  | "daily-storage-review-rubric"
  | "labeling-and-packaging-protocol-v6"
  | "clinical-unit-request-and-dispatch-protocol-v8"
  | "medication-prescription-format-v6"
  | "medical-supplies-storage-protocol-v1"
  | "medications-storage-protocol-v1"
  | "seminar-diagnosis-2026"
  | "arsenal-2026";

export type EducationalSource = {
  authority: "institutional" | "academic" | "catalog";
  id: EducationalSourceId;
  reviewStatus: "source-identified" | "pending-professional-review" | "approved-for-training";
  title: string;
  versionLabel: string;
};

export type DispensingCriterionId =
  | "criterion-1-request-identity-document"
  | "criterion-2-system-identity-match"
  | "criterion-3-identify-all-prescriptions"
  | "criterion-4-confirm-prescription-issued"
  | "criterion-5-compare-prepared-items"
  | "criterion-6-recheck-identity-before-handoff"
  | "criterion-7-provide-corresponding-instructions";

export type DispensingCriterion = {
  id: DispensingCriterionId;
  observableAction: string;
  sourceId: EducationalSourceId;
  title: string;
  trainingBoundary: string;
};

export type AttemptCriterionStatus = "met" | "reinforcement" | "intercepted";

export type AttemptCriterionResult = {
  criterionId: DispensingCriterionId;
  status: AttemptCriterionStatus;
};

export type TrainingLevelStatus = "available" | "coming-soon" | "completed" | "locked";

export type TrainingMode = {
  guidance: "guided" | "standard" | "minimal";
  id: string;
  interruptionStageIds: string[];
  levelId: string;
  notice?: string;
  pressureTargetSeconds?: number;
  shortLabel: string;
};

export type PharmacyArea =
  | "entrance"
  | "service-counter"
  | "clinical-terminal"
  | "storage"
  | "preparation-counter"
  | "dispatch-counter";

export type CompetencyId =
  | "patient-identification"
  | "request-review"
  | "product-selection"
  | "concentration-verification"
  | "final-verification";

export type CompetencyStatus = "mastered" | "in-progress" | "reinforcement";

export type TrainingCompetency = {
  description: string;
  id: CompetencyId;
  name: string;
};

export type TrainingLevel = {
  caseSlugs: string[];
  description: string;
  id: string;
  number: number;
  status: TrainingLevelStatus;
  title: string;
};

export type TrainingError = {
  competencyId: CompetencyId;
  description: string;
  id: string;
  severity: "important" | "minor";
};

export type SafetyBarrier = {
  competencyId: CompetencyId;
  description: string;
  id: string;
  name: string;
};

export type TrainingEffect =
  | { actionId: string; type: "record-action" }
  | { errorId: string; type: "record-error" }
  | { errorId: string; type: "detect-error" }
  | { errorId: string; type: "correct-error" }
  | { barrierId: string; type: "activate-barrier" }
  | { itemId: string; type: "select-item" };

export type ContinueInteraction = {
  label: string;
  nextStageId: string;
  type: "continue";
};

export type CompleteInteraction = {
  label: string;
  type: "complete";
};

export type DecisionOption = {
  effects?: TrainingEffect[];
  feedback?: string;
  feedbackTiming: "deferred" | "immediate" | "none";
  id: string;
  isCorrect: boolean;
  label: string;
  nextStageId: string;
};

export type DecisionInteraction = {
  options: DecisionOption[];
  prompt: string;
  type: "decision";
};

export type SelectableItem = {
  description?: string;
  id: string;
  label: string;
};

export type ItemSelectionInteraction = {
  items: SelectableItem[];
  options: DecisionOption[];
  prompt: string;
  type: "item-selection";
};

export type ObservableAction = {
  description?: string;
  effects?: TrainingEffect[];
  id: string;
  label: string;
  required: boolean;
};

/**
 * A sequence of visible actions. It lets a training case assess what the
 * participant does, rather than asking which answer they would choose.
 */
export type OperationalCheckInteraction = {
  actions: ObservableAction[];
  completeLabel: string;
  nextStageId: string;
  prompt: string;
  type: "operational-check";
};

export type TrainingStageInteraction =
  | CompleteInteraction
  | ContinueInteraction
  | DecisionInteraction
  | ItemSelectionInteraction
  | OperationalCheckInteraction;

export type TrainingStageType =
  | "context"
  | "patient-dialogue"
  | "identification"
  | "operational-check"
  | "clinical-system"
  | "prescription"
  | "area-transition"
  | "storage-selection"
  | "preparation"
  | "safety-barrier"
  | "final-verification"
  | "dispatch"
  | "result"
  | "learning-card"
  | "reinforcement";

export type TrainingStage = {
  area: PharmacyArea;
  competencyIds: CompetencyId[];
  content: string;
  criterionIds?: DispensingCriterionId[];
  id: string;
  interaction: TrainingStageInteraction;
  title: string;
  type: TrainingStageType;
};

export type ScenarioTrap = {
  errorId: string;
  id: string;
  patientImpactIfUnresolved: boolean;
  recoveryStageIds: string[];
  revealStageIds: string[];
  triggerOptionId: string;
  triggerStageId: string;
};

export type TrainingCase = {
  barriers: SafetyBarrier[];
  competencies: CompetencyId[];
  contentValidation: ContentValidationStatus;
  context: {
    location: string;
    patientDescription: string;
    timeLabel: string;
  };
  dispensingCriterionIds?: DispensingCriterionId[];
  description: string;
  errors: TrainingError[];
  id: string;
  initialStageId: string;
  levelId: string;
  professionalReviewMarker?: typeof PROFESSIONAL_REVIEW_MARKER;
  reinforcementCaseSlug?: string;
  stages: TrainingStage[];
  title: string;
  traps: ScenarioTrap[];
  version: string;
};

export type TrainingAttemptOutcome = {
  barrierEffective: boolean;
  competencyStatuses: Partial<Record<CompetencyId, CompetencyStatus>>;
  correctedErrorIds: string[];
  detectedErrorIds: string[];
  errorReachedPatient: boolean;
  recordedErrorIds: string[];
  recommendedCaseSlug?: string;
};
