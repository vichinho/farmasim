import { trainingCompetencies } from "@/data/training/competencies";
import { case001AmbulatoryDispensing } from "@/data/training/cases/case-001-ambulatory-dispensing";
import { assertValidTrainingCase } from "@/data/training/validate-training-case";
import { CONTENT_TRACEABILITY_NOTE, type TrainingCase } from "@/types/training-simulation";

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
    label: `Abrir caja ${config.productName} ${config.requestedStrength}`,
    feedbackTiming: "none" as const,
    effects: [{ type: "select-item" as const, itemId: "target-product" }],
    nextStageId: "preparation",
  };
  const distractorOption = {
    id: "select-distractor-product",
    isCorrect: true,
    label: `Abrir caja ${config.productName} ${config.distractorStrength}`,
    feedbackTiming: "none" as const,
    effects: [{ type: "select-item" as const, itemId: "distractor-product" }],
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
        content: `${CONTENT_TRACEABILITY_NOTE} Solicitud demostrativa: ${config.productName} ${config.requestedStrength}. No constituye una indicación ni una regla de dispensación.`,
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
        content: `${CONTENT_TRACEABILITY_NOTE} La nueva disposición muestra dos cajas ficticias con presentaciones diferentes.`,
        interaction: {
          type: "item-selection" as const,
          prompt: "Abre una caja ficticia para consultar su etiqueta antes de continuar.",
          items: config.distractorFirst
            ? [distractorItem, correctItem]
            : [correctItem, distractorItem],
          options: config.distractorFirst
            ? [distractorOption, correctOption]
            : [correctOption, distractorOption],
        },
      };
    }

    if (stage.id === "double-check" && stage.interaction.type === "operational-check") {
      return {
        ...stage,
        interaction: {
          ...stage.interaction,
          actions: stage.interaction.actions.map((action) =>
            action.id === "open-prepared-box"
              ? {
                  ...action,
                  description: `${config.productName} · ${config.distractorStrength} · comprimidos · cantidad 30`,
                }
              : action,
          ),
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
    traceability: {
      ...case001AmbulatoryDispensing.traceability,
      medicationUsed: `${config.productName} ${config.requestedStrength} (ficticio)`,
      scope: "Escenario de refuerzo autónomo para comparar concentraciones en un contexto ficticio.",
    },
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
    safetyInterceptions: [
      {
        errorId: "wrong-concentration",
        prescription: `${config.productName} ${config.requestedStrength} · comprimidos · cantidad 30`,
        preparation: `${config.productName} ${config.distractorStrength} · comprimidos · cantidad 30`,
        explanation:
          "El error no fue detectado durante el doble chequeo. La simulación lo interceptó antes de que el medicamento alcanzara al paciente virtual.",
      },
    ],
    stages,
  } satisfies TrainingCase;

  return assertValidTrainingCase(definition, trainingCompetencies);
}
