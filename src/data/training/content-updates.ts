export type TrainingContentUpdate = {
  caseSlug?: string;
  description: string;
  id: string;
  publishedLabel: string;
  title: string;
  type: "case" | "feature" | "training";
  version: string;
};

export const trainingContentUpdates = [
  {
    id: "adaptive-reinforcement",
    type: "feature",
    version: "1.1",
    publishedLabel: "13 de agosto de 2026",
    title: "Entrenamiento adaptativo",
    description: "Los resultados ahora recomiendan otro caso cuando una competencia necesita refuerzo.",
  },
  {
    id: "case-002-update",
    type: "case",
    version: "1.1",
    publishedLabel: "13 de agosto de 2026",
    title: "Caso 002 disponible",
    description: "Nuevo contexto ficticio para practicar verificación de concentración.",
    caseSlug: "case-002-concentration-reinforcement",
  },
  {
    id: "pressure-training",
    type: "training",
    version: "1.1",
    publishedLabel: "13 de agosto de 2026",
    title: "Modo presión",
    description: "El nivel 3 incorpora interrupciones controladas y un objetivo de tiempo informativo.",
    caseSlug: "case-001-ambulatory-dispensing",
  },
] satisfies TrainingContentUpdate[];
