import { trainingCompetencies } from "@/data/training/competencies";
import { case006MultipleErrors } from "@/data/training/cases/case-006-multiple-errors";
import { assertValidTrainingCase } from "@/data/training/validate-training-case";
import { PROFESSIONAL_REVIEW_MARKER, type TrainingCase } from "@/types/training-simulation";

const case007Definition = {
  ...case006MultipleErrors,
  id: "case-007-expert-mode",
  levelId: "level-7",
  version: "1.0.0-demo",
  title: "Caso 007 - Modo experto",
  description:
    "Caso ficticio de cierre con orientación reducida para practicar la detección de discrepancias antes de la entrega.",
  context: {
    timeLabel: "16:05 h",
    location: "Ventanilla ficticia de práctica E",
    patientDescription: "Paciente virtual, sin datos personales reales.",
  },
  traps: case006MultipleErrors.traps.map((trap) => ({
    ...trap,
    id: "case-007-concentration-trap",
  })),
  stages: case006MultipleErrors.stages.map((stage) => {
    if (stage.id === "case-context") {
      return {
        ...stage,
        content:
          "16:05 h. Inicia un caso ficticio de cierre con las barreras de seguridad habituales disponibles, sin orientación inicial.",
      };
    }

    if (stage.id === "patient-arrival") {
      return {
        ...stage,
        content: "Hola. Vengo a retirar una solicitud ficticia que aparece como disponible.",
      };
    }

    if (stage.id === "prescription-review") {
      return {
        ...stage,
        content: `${PROFESSIONAL_REVIEW_MARKER} Solicitud demostrativa: Producto farmacológico F-310, presentación ficticia A. No constituye una indicación ni una regla de dispensación.`,
      };
    }

    if (stage.id === "drawer-selection" && stage.interaction.type === "item-selection") {
      return {
        ...stage,
        interaction: {
          ...stage.interaction,
          items: [
            { id: "drawer-target", label: "Gaveta F-310 - presentación ficticia A" },
            { id: "drawer-other-a", label: "Gaveta A - contenido ficticio" },
            { id: "drawer-other-b", label: "Gaveta B - contenido ficticio" },
          ],
          options: stage.interaction.options.map((option) =>
            option.id === "open-target-drawer"
              ? {
                  ...option,
                  label: "Abrir gaveta F-310",
                }
              : option,
          ),
        },
      };
    }

    if (stage.id === "product-selection" && stage.interaction.type === "item-selection") {
      return {
        ...stage,
        content: `${PROFESSIONAL_REVIEW_MARKER} La gaveta ficticia contiene dos presentaciones visualmente similares.`,
        interaction: {
          ...stage.interaction,
          prompt: "Selecciona la presentación ficticia correspondiente a la solicitud.",
          items: [
            { id: "product-a", label: "Producto farmacológico F-310 - presentación ficticia A" },
            { id: "product-b", label: "Producto farmacológico F-310 - presentación ficticia B" },
          ],
          options: stage.interaction.options.map((option) =>
            option.id === "select-product-a"
              ? { ...option, label: "Seleccionar presentación ficticia A" }
              : option.id === "select-product-b"
                ? { ...option, label: "Seleccionar presentación ficticia B" }
                : option,
          ),
        },
      };
    }

    if (stage.id === "preparation") {
      return {
        ...stage,
        content: "TENS 2 virtual entrega una bandeja ficticia para continuar con las comprobaciones de cierre.",
      };
    }

    return stage;
  }),
} satisfies TrainingCase;

export const case007ExpertMode = assertValidTrainingCase(case007Definition, trainingCompetencies);
