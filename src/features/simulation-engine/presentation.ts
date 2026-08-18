"use client";

/**
 * Client-only public entrypoint for playable presentation layers.
 *
 * 3D/web/mobile components should import from this file instead of the engine
 * barrel so React client boundaries remain explicit.
 */
export {
  useSimulationExperience,
} from "@/features/simulation-engine/use-simulation-experience";
export type {
  SimulationExperiencePhase,
  UseSimulationExperienceInput,
  UseSimulationExperienceResult,
} from "@/features/simulation-engine/use-simulation-experience";
export type {
  SimulationIntegrationCapabilities,
  SimulationIntegrationDispatchReceipt,
  SimulationIntegrationSnapshot,
  SimulationPlayerActionInput,
} from "@/features/simulation-engine/integration-contract";
