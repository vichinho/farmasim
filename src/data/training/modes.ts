import type { TrainingMode } from "@/types/training-simulation";

export const trainingModes = [
  {
    id: "guided-process",
    levelId: "level-1",
    shortLabel: "Recorrido guiado",
    guidance: "guided",
    interruptionStageIds: [],
  },
  {
    id: "deferred-trap",
    levelId: "level-2",
    shortLabel: "Trampa diferida",
    guidance: "standard",
    interruptionStageIds: [],
  },
  {
    id: "pressure-shift",
    levelId: "level-3",
    shortLabel: "Turno con presión",
    guidance: "minimal",
    interruptionStageIds: ["clinical-system", "product-selection", "final-check"],
    pressureTargetSeconds: 180,
  },
] satisfies TrainingMode[];

export function getTrainingModeByLevelId(levelId: string) {
  return trainingModes.find((mode) => mode.levelId === levelId) ?? trainingModes[0];
}
