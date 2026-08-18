export {
  bootstrapSimulationRuntime,
  SimulationBootstrapError,
} from "@/features/simulation-engine/bootstrap";
export type {
  SimulationBootstrapInput,
  SimulationBootstrapResult,
  SimulationBootstrapSource,
  SimulationCheckpointLoader,
} from "@/features/simulation-engine/bootstrap";
export {
  buildSimulationAttemptCompletion,
  SimulationCompletionError,
} from "@/features/simulation-engine/completion";
export type {
  SimulationAttemptCompletion,
} from "@/features/simulation-engine/completion";
export {
  SimulationExperienceController,
} from "@/features/simulation-engine/experience-controller";
export type {
  FinalizeSimulationExperienceInput,
  FinalizeSimulationExperienceResult,
  OpenSimulationExperienceInput,
  SimulationExperienceAttemptInput,
  SimulationExperienceAttemptResult,
  SimulationExperiencePersistence,
  SimulationExperienceState,
} from "@/features/simulation-engine/experience-controller";
export {
  arsenal2026SimulationCatalogs,
  technicalSimulationCatalogs,
} from "@/features/simulation-engine/catalogs";
export type { SimulationCatalogs } from "@/features/simulation-engine/catalogs";
export {
  DIFFICULTY_PROFILES,
  getDifficultyProfile,
} from "@/features/simulation-engine/difficulty-engine";
export type { DifficultyProfile } from "@/features/simulation-engine/difficulty-engine";
export {
  describeGeneratedPatient,
  generateDynamicScenarioSession,
} from "@/features/simulation-engine/dynamic-session-generator";
export type { DynamicScenarioGenerationOptions } from "@/features/simulation-engine/dynamic-session-generator";
export { evaluateSimulation } from "@/features/simulation-engine/engine";
export type { EvaluateSimulationOptions } from "@/features/simulation-engine/engine";
export { SimulationEventLog } from "@/features/simulation-engine/event-log";
export { deriveRuntimeHandoffState } from "@/features/simulation-engine/handoff-state";
export type {
  RuntimeHandoffOwner,
  RuntimeHandoffState,
} from "@/features/simulation-engine/handoff-state";
export {
  deriveSimulationIntegrationSnapshot,
  resolvePlayerActor,
  SIMULATION_INTEGRATION_CONTRACT_VERSION,
} from "@/features/simulation-engine/integration-contract";
export type {
  SimulationIntegrationCapabilities,
  SimulationIntegrationDispatchReceipt,
  SimulationIntegrationSnapshot,
  SimulationPlayerActionInput,
} from "@/features/simulation-engine/integration-contract";
export { SimulationIntegrationRuntime } from "@/features/simulation-engine/integration-runtime";
export {
  deriveRuntimeInventoryState,
  resolveMedicationStockSource,
} from "@/features/simulation-engine/inventory-state";
export type {
  MedicationStockSource,
  RuntimeDrawerInventoryState,
  RuntimeInventoryItemState,
  RuntimeInventoryState,
} from "@/features/simulation-engine/inventory-state";
export {
  deriveRuntimeMaterialState,
  resolveMedicationPresentationId,
  runtimeEffectiveSession,
} from "@/features/simulation-engine/material-state";
export type { RuntimeMaterialState } from "@/features/simulation-engine/material-state";
export {
  createSimulationCheckpoint,
  parseSimulationCheckpoint,
  serializeSimulationCheckpoint,
  SIMULATION_CHECKPOINT_VERSION,
  SimulationCheckpointError,
} from "@/features/simulation-engine/persistence";
export type { SimulationCheckpoint } from "@/features/simulation-engine/persistence";
export {
  deriveRuntimePreparationWorkflow,
} from "@/features/simulation-engine/preparation-workflow";
export type {
  RuntimePreparationWorkflowState,
} from "@/features/simulation-engine/preparation-workflow";
export { selectReinforcement } from "@/features/simulation-engine/reinforcement-engine";
export {
  SimulationRuntime,
  SimulationRuntimeError,
} from "@/features/simulation-engine/runtime";
export {
  createDeterministicRandom,
  generateScenarioSession,
} from "@/features/simulation-engine/scenario-generator";
export { evaluateDeliverySafety } from "@/features/simulation-engine/safety-engine";
export { validateScenarioSession } from "@/features/simulation-engine/scenario-validator";
export { deriveSimulationState } from "@/features/simulation-engine/state";

export type {
  Actor,
  ActorController,
  BarrierExecution,
  CompetencyId,
  CompetencyResult,
  DeliverySafetyResult,
  DeterministicRandom,
  DiscrepancyTransition,
  Drawer,
  DrawerContentItem,
  GameMode,
  HealthcareFacility,
  InitialClinicalSystemState,
  MedicationDiscrepancy,
  MedicationPresentation,
  MedicationPresentationSource,
  Preparation,
  ProcessCriterionResult,
  ProcessDeviation,
  SafetyBarrierFailure,
  ScenarioCandidateFactory,
  ScenarioDefinition,
  ScenarioGenerationContext,
  ScenarioGenerationResult,
  ScenarioValidationResult,
  SimulationActionInput,
  SimulationDispatchReceipt,
  SimulationEvaluation,
  SimulationEvent,
  SimulationEventType,
  SimulationRole,
  SimulationRuntimeSnapshot,
  SimulationRuntimeStatus,
  SimulationSession,
  SimulationState,
  SyntheticPatient,
} from "@/features/simulation-engine/types";
