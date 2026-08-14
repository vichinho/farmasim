import type { TrainingLevel } from "@/types/training-simulation";

export const trainingLevels = [
  {
    id: "level-1",
    number: 1,
    title: "Aprende el proceso",
    description: "Recorre cada etapa con orientación visible.",
    status: "available",
    caseSlugs: ["case-001-ambulatory-dispensing"],
  },
  {
    id: "level-2",
    number: 2,
    title: "Detecta la trampa",
    description: "Practica una discrepancia ficticia y utiliza una barrera de seguridad.",
    status: "available",
    caseSlugs: ["case-002-concentration-reinforcement"],
  },
  {
    id: "level-3",
    number: 3,
    title: "Trabaja bajo presión",
    description: "Resuelve interrupciones demostrativas sin perder el orden del proceso.",
    status: "available",
    caseSlugs: ["case-003-concentration-reinforcement"],
  },
  {
    id: "level-4",
    number: 4,
    title: "Consolida el proceso",
    description: "Integra lo aprendido en un cuarto caso con menor orientación.",
    status: "locked",
    caseSlugs: ["case-004-concentration-reinforcement"],
  },
  {
    id: "level-5",
    number: 5,
    title: "Medicamentos LASA",
    description: "Contenido futuro pendiente de validación profesional.",
    status: "locked",
    caseSlugs: [],
  },
  {
    id: "level-6",
    number: 6,
    title: "Errores múltiples",
    description: "Nivel futuro con más de una discrepancia por caso.",
    status: "locked",
    caseSlugs: [],
  },
  {
    id: "level-7",
    number: 7,
    title: "Modo experto",
    description: "Nivel futuro sin orientación inicial.",
    status: "locked",
    caseSlugs: [],
  },
] satisfies TrainingLevel[];

export function resolveTrainingLevels(completedLevelNumbers: number[]) {
  const completed = new Set(completedLevelNumbers);
  const levelFourUnlocked = [1, 2, 3].every((levelNumber) => completed.has(levelNumber));

  return trainingLevels.map((level) => {
    if (completed.has(level.number)) {
      return { ...level, status: "completed" as const };
    }

    if (level.number === 4 && levelFourUnlocked) {
      return { ...level, status: "available" as const };
    }

    return level;
  });
}

export function getTrainingLevelByCaseSlug(caseSlug: string) {
  return trainingLevels.find((level) => level.caseSlugs.includes(caseSlug));
}
