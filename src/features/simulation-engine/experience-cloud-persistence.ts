import {
  deleteSimulationCheckpointFromCloud,
  loadLatestSimulationCheckpointFromCloud,
  saveSimulationCheckpointToCloud,
} from "@/features/simulation-engine/checkpoint-actions";
import { saveSimulationExperienceAttempt } from "@/features/simulation-engine/completion-actions";
import type { SimulationExperiencePersistence } from "@/features/simulation-engine/experience-controller";

/**
 * Production-facing persistence adapter for playable simulation experiences.
 * Presentation code should depend on SimulationExperiencePersistence instead
 * of importing checkpoint/progress Server Actions directly.
 */
export const cloudSimulationExperiencePersistence: SimulationExperiencePersistence = {
  async loadLatestCheckpoint(scenarioDefinitionId) {
    const result = await loadLatestSimulationCheckpointFromCloud(scenarioDefinitionId);

    if (result.status === "missing") return null;
    if (result.status !== "loaded" || !result.serializedCheckpoint) {
      throw new Error(result.message);
    }

    return result.serializedCheckpoint;
  },

  async saveCheckpoint(serializedCheckpoint) {
    const result = await saveSimulationCheckpointToCloud(serializedCheckpoint);
    if (result.status !== "saved") throw new Error(result.message);
  },

  async deleteCheckpoint(sessionId) {
    const result = await deleteSimulationCheckpointFromCloud(sessionId);
    if (result.status !== "deleted") throw new Error(result.message);
  },

  saveAttempt: saveSimulationExperienceAttempt,
};
