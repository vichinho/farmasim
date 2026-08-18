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
