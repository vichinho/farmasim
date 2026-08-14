export const PROFESSIONAL_REVIEW_MARKER =
  "[CONTENIDO PENDIENTE DE VALIDACIÓN PROFESIONAL]";

export type ContentValidationStatus =
  | "demonstrative"
  | "pending-professional-review"
  | "professionally-validated";

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

export type TrainingStageInteraction =
  | CompleteInteraction
  | ContinueInteraction
  | DecisionInteraction
  | ItemSelectionInteraction;

export type TrainingStageType =
  | "context"
  | "patient-dialogue"
  | "identification"
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
