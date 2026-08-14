import { trainingCompetencies } from "@/data/training/competencies";
import { case001AmbulatoryDispensing } from "@/data/training/cases/case-001-ambulatory-dispensing";
import { assertValidTrainingCase } from "@/data/training/validate-training-case";
import { CONTENT_TRACEABILITY_NOTE, type TrainingCase } from "@/types/training-simulation";

const case006Definition = {
  ...case001AmbulatoryDispensing,
  id: "case-006-multiple-errors",
  levelId: "level-6",
  version: "1.0.0-demo",
  title: "Caso 006 - Discrepancias múltiples",
  description:
    "Caso ficticio con más de una discrepancia potencial para practicar barreras de seguridad antes del cierre.",
  traceability: {
    ...case001AmbulatoryDispensing.traceability,
    medicationUsed: "Producto farmacológico F-210 (ficticio)",
    scope: "Escenario educativo de detección de discrepancias múltiples.",
  },
  reinforcementCaseSlug: undefined,
  context: {
    timeLabel: "14:20 h",
    location: "Ventanilla ficticia de práctica D",
    patientDescription: "Paciente virtual, sin datos personales reales.",
  },
  errors: [
    ...case001AmbulatoryDispensing.errors,
    {
      id: "tray-quantity-mismatch",
      competencyId: "final-verification",
      description: "La bandeja ficticia contiene una cantidad distinta a la solicitud demostrativa.",
      severity: "important",
    },
  ],
  barriers: [...case001AmbulatoryDispensing.barriers],
  traps: [
    {
      ...case001AmbulatoryDispensing.traps[0],
      id: "case-006-concentration-trap",
      triggerOptionId: "select-product-b",
    },
  ],
  stages: case001AmbulatoryDispensing.stages.map((stage) => {
    if (stage.id === "case-context") {
      return {
        ...stage,
        content: "14:20 h. La ventanilla ficticia inicia un caso con comprobaciones simultáneas.",
      };
    }

    if (stage.id === "patient-arrival") {
      return {
        ...stage,
        content: "Buenos días. Vengo a retirar una solicitud ficticia que aparece como disponible.",
      };
    }

    if (stage.id === "prescription-review") {
      return {
        ...stage,
        content: `${CONTENT_TRACEABILITY_NOTE} Solicitud demostrativa: Producto farmacológico F-210, presentación ficticia A. No constituye una indicación ni una regla de dispensación.`,
      };
    }

    if (stage.id === "drawer-selection" && stage.interaction.type === "item-selection") {
      return {
        ...stage,
        interaction: {
          ...stage.interaction,
          items: [
            { id: "drawer-target", label: "Gaveta F-210 - presentación ficticia A" },
            { id: "drawer-other-a", label: "Gaveta A - contenido ficticio" },
            { id: "drawer-other-b", label: "Gaveta B - contenido ficticio" },
          ],
          options: stage.interaction.options.map((option) =>
            option.id === "open-losartan-drawer"
              ? {
                  ...option,
                  id: "open-target-drawer",
                  label: "Abrir gaveta F-210",
                  effects: [{ type: "select-item" as const, itemId: "drawer-target" }],
                }
              : option,
          ),
        },
      };
    }

    if (stage.id === "product-selection") {
      return {
        ...stage,
        content: `${CONTENT_TRACEABILITY_NOTE} La gaveta ficticia contiene dos presentaciones visualmente similares.`,
        interaction: {
          type: "item-selection" as const,
          prompt: "Selecciona la presentación ficticia A para continuar.",
          items: [
            { id: "product-a", label: "Producto farmacológico F-210 - presentación ficticia A" },
            { id: "product-b", label: "Producto farmacológico F-210 - presentación ficticia B" },
          ],
          options: [
            {
              id: "select-product-a",
              isCorrect: true,
              label: "Seleccionar presentación ficticia A",
              feedbackTiming: "deferred" as const,
              effects: [{ type: "select-item" as const, itemId: "product-a" }],
              nextStageId: "preparation",
            },
            {
              id: "select-product-b",
              isCorrect: false,
              label: "Seleccionar presentación ficticia B",
              feedbackTiming: "deferred" as const,
              effects: [
                { type: "select-item" as const, itemId: "product-b" },
                { type: "record-error" as const, errorId: "wrong-concentration" },
              ],
              nextStageId: "preparation",
            },
          ],
        },
      };
    }

    if (stage.id === "preparation") {
      return {
        ...stage,
        content: "TENS 2 virtual entrega una bandeja ficticia para la revisión. La actividad incorpora una segunda discrepancia potencial.",
        interaction: {
          type: "operational-check" as const,
          prompt: "Recibe la bandeja ficticia y trasládala a la verificación.",
          actions: [
            {
              id: "receive-fictional-tray-with-quantity-mismatch",
              label: "Recibir bandeja ficticia de TENS 2",
              description: "La discrepancia no se revela hasta que realices la comparación correspondiente.",
              required: true,
              effects: [{ type: "record-error" as const, errorId: "tray-quantity-mismatch" }],
            },
          ],
          completeLabel: "Ir al doble chequeo",
          nextStageId: "double-check",
        },
      };
    }

    if (stage.id === "double-check" && stage.interaction.type === "decision") {
      return {
        ...stage,
        interaction: {
          ...stage.interaction,
          options: stage.interaction.options.map((option) =>
            option.id === "perform-double-check"
              ? {
                  ...option,
                  effects: [
                    { type: "activate-barrier" as const, barrierId: "double-check" },
                    { type: "detect-error" as const, errorId: "wrong-concentration" },
                    { type: "correct-error" as const, errorId: "wrong-concentration" },
                    { type: "detect-error" as const, errorId: "tray-quantity-mismatch" },
                    { type: "correct-error" as const, errorId: "tray-quantity-mismatch" },
                    { type: "select-item" as const, itemId: "product-a" },
                  ],
                }
              : option,
          ),
        },
      };
    }

    if (stage.id === "final-check" && stage.interaction.type === "operational-check") {
      return {
        ...stage,
        interaction: {
          ...stage.interaction,
          actions: stage.interaction.actions.map((action) => {
            if (action.id === "inspect-fictional-tray-concentration") {
              return {
                ...action,
                effects: [
                  { type: "activate-barrier" as const, barrierId: "final-check" },
                  { type: "detect-error" as const, errorId: "wrong-concentration" },
                  { type: "correct-error" as const, errorId: "wrong-concentration" },
                  { type: "select-item" as const, itemId: "product-a" },
                ],
              };
            }

            if (action.id === "inspect-fictional-tray-quantity") {
              return {
                ...action,
                effects: [
                  { type: "activate-barrier" as const, barrierId: "final-check" },
                  { type: "detect-error" as const, errorId: "tray-quantity-mismatch" },
                  { type: "correct-error" as const, errorId: "tray-quantity-mismatch" },
                ],
              };
            }

            return action;
          }),
        },
      };
    }

    return stage;
  }),
} satisfies TrainingCase;

export const case006MultipleErrors = assertValidTrainingCase(case006Definition, trainingCompetencies);
