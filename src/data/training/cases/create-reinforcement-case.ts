import { trainingCompetencies } from "@/data/training/competencies";
import { case001AmbulatoryDispensing } from "@/data/training/cases/case-001-ambulatory-dispensing";
import { assertValidTrainingCase } from "@/data/training/validate-training-case";
import { PROFESSIONAL_REVIEW_MARKER, type TrainingCase } from "@/types/training-simulation";

type ReinforcementCaseConfig = {
  description: string;
  distractorFirst?: boolean;
  distractorStrength: string;
  id: string;
  levelId: string;
  location: string;
  patientDescription: string;
  patientDialogue: string;
  productName: string;
  reinforcementCaseSlug?: string;
  requestedStrength: string;
  timeLabel: string;
  title: string;
};

export function createReinforcementCase(config: ReinforcementCaseConfig) {
  const correctLabel = `${config.productName} ${config.requestedStrength} - producto ficticio`;
  const distractorLabel = `${config.productName} ${config.distractorStrength} - producto ficticio`;
  const correctItem = { id: "target-product", label: correctLabel };
  const distractorItem = { id: "distractor-product", label: distractorLabel };
  const correctOption = {
    id: "select-target-product",
    isCorrect: true,
    label: `Seleccionar ${config.productName} ${config.requestedStrength}`,
    feedbackTiming: "deferred" as const,
    effects: [{ type: "select-item" as const, itemId: "target-product" }],
    nextStageId: "preparation",
  };
  const distractorOption = {
    id: "select-distractor-product",
    isCorrect: false,
    label: `Seleccionar ${config.productName} ${config.distractorStrength}`,
    feedbackTiming: "deferred" as const,
    effects: [
      { type: "select-item" as const, itemId: "distractor-product" },
      { type: "record-error" as const, errorId: "wrong-concentration" },
    ],
    nextStageId: "preparation",
  };

  const stages = case001AmbulatoryDispensing.stages.map((stage) => {
    if (stage.id === "case-context") {
      return { ...stage, content: `${config.timeLabel}. ${config.location} inicia una nueva atención ficticia.` };
    }

    if (stage.id === "patient-arrival") {
      return { ...stage, content: config.patientDialogue };
    }

    if (stage.id === "prescription-review") {
      return {
        ...stage,
        content: `${PROFESSIONAL_REVIEW_MARKER} Solicitud demostrativa: ${config.productName} ${config.requestedStrength}. No constituye una indicación ni una regla de dispensación.`,
      };
    }

    if (stage.id === "drawer-selection" && stage.interaction.type === "item-selection") {
      return {
        ...stage,
        interaction: {
          ...stage.interaction,
          items: [
            { id: "drawer-other-a", label: "Gaveta A - contenido ficticio" },
            {
              id: "drawer-target",
              label: `Gaveta ${config.productName.toUpperCase()} ${config.requestedStrength}`,
            },
            { id: "drawer-other-b", label: "Gaveta B - contenido ficticio" },
          ],
          options: [
            {
              id: "open-other-drawer-a",
              isCorrect: false,
              label: "Abrir gaveta A",
              feedbackTiming: "immediate" as const,
              feedback: "La etiqueta ficticia no coincide. Puedes revisar otra gaveta.",
              nextStageId: "drawer-selection",
            },
            {
              id: "open-target-drawer",
              isCorrect: true,
              label: `Abrir gaveta ${config.productName.toUpperCase()} ${config.requestedStrength}`,
              feedbackTiming: "none" as const,
              effects: [{ type: "select-item" as const, itemId: "drawer-target" }],
              nextStageId: "product-selection",
            },
            {
              id: "open-other-drawer-b",
              isCorrect: false,
              label: "Abrir gaveta B",
              feedbackTiming: "immediate" as const,
              feedback: "La etiqueta ficticia no coincide. Puedes revisar otra gaveta.",
              nextStageId: "drawer-selection",
            },
          ],
        },
      };
    }

    if (stage.id === "product-selection") {
      return {
        ...stage,
        content: `${PROFESSIONAL_REVIEW_MARKER} La nueva disposición muestra dos cajas ficticias con presentaciones diferentes.`,
        interaction: {
          type: "item-selection" as const,
          prompt: "Selecciona una caja para continuar la demostración.",
          items: config.distractorFirst
            ? [distractorItem, correctItem]
            : [correctItem, distractorItem],
          options: config.distractorFirst
            ? [distractorOption, correctOption]
            : [correctOption, distractorOption],
        },
      };
    }

    if (
      (stage.id === "double-check" || stage.id === "final-check") &&
      stage.interaction.type === "decision"
    ) {
      return {
        ...stage,
        interaction: {
          ...stage.interaction,
          options: stage.interaction.options.map((option) => ({
            ...option,
            effects: option.effects?.map((effect) =>
              effect.type === "select-item"
                ? { type: "select-item" as const, itemId: "target-product" }
                : effect,
            ),
          })),
        },
      };
    }

    return stage;
  });

  const definition = {
    ...case001AmbulatoryDispensing,
    id: config.id,
    levelId: config.levelId,
    version: "1.0.0-demo",
    title: config.title,
    description: config.description,
    reinforcementCaseSlug: config.reinforcementCaseSlug,
    context: {
      location: config.location,
      patientDescription: config.patientDescription,
      timeLabel: config.timeLabel,
    },
    errors: case001AmbulatoryDispensing.errors.map((error) =>
      error.id === "wrong-concentration"
        ? {
            ...error,
            description: `Se seleccionó la presentación ficticia de ${config.distractorStrength} en lugar de ${config.requestedStrength}.`,
          }
        : error,
    ),
    traps: [
      {
        ...case001AmbulatoryDispensing.traps[0],
        id: `${config.id}-concentration-trap`,
        triggerOptionId: "select-distractor-product",
      },
    ],
    stages,
  } satisfies TrainingCase;

  return assertValidTrainingCase(definition, trainingCompetencies);
}
