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
    notice: "Modo trampa: algunas decisiones avanzan sin revelar inmediatamente si existe una discrepancia.",
  },
  {
    id: "pressure-shift",
    levelId: "level-3",
    shortLabel: "Turno con presión",
    guidance: "minimal",
    interruptionStageIds: ["clinical-system", "product-selection", "final-check"],
    notice: "Modo presión: habrá interrupciones y la orientación estará reducida. El cronómetro es informativo.",
    pressureTargetSeconds: 180,
  },
  {
    id: "process-consolidation",
    levelId: "level-4",
    shortLabel: "Consolidación",
    guidance: "minimal",
    interruptionStageIds: [],
    notice: "Modo consolidación: resuelve un caso nuevo con orientación reducida y sin interrupciones adicionales.",
  },
  {
    id: "storage-review",
    levelId: "level-5",
    shortLabel: "Revisión de almacenamiento",
    guidance: "guided",
    interruptionStageIds: [],
    notice: "Los códigos y productos son ficticios. El módulo no sustituye la revisión institucional ni la evaluación del QF.",
  },
  {
    id: "multiple-errors",
    levelId: "level-6",
    shortLabel: "Discrepancias múltiples",
    guidance: "standard",
    interruptionStageIds: [],
    notice: "Dos discrepancias ficticias pueden coexistir. El cierre exige que ambas sean interceptadas por una barrera de seguridad.",
  },
] satisfies TrainingMode[];

export function getTrainingModeByLevelId(levelId: string) {
  return trainingModes.find((mode) => mode.levelId === levelId) ?? trainingModes[0];
}
