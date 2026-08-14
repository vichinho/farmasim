import { trainingCompetencies } from "@/data/training/competencies";
import { assertValidTrainingCase } from "@/data/training/validate-training-case";
import {
  PROFESSIONAL_REVIEW_MARKER,
  type TrainingCase,
} from "@/types/training-simulation";

const case005Definition = {
  id: "case-005-storage-review",
  version: "1.0.0-demo",
  levelId: "level-5",
  title: "Caso 005 - Revisión de almacenamiento",
  description:
    "Caso ficticio para practicar el registro diario de almacenamiento y la separación entre medicamentos e insumos.",
  contentValidation: "educational-development",
  initialStageId: "storage-context",
  context: {
    timeLabel: "07:45 h",
    location: "Área de almacenamiento ficticia",
    patientDescription: "Sin atención de paciente: revisión interna ficticia de almacenamiento.",
  },
  competencies: ["storage-domain-separation", "storage-record-review"],
  errors: [
    {
      id: "mixed-storage-domains",
      competencyId: "storage-domain-separation",
      description: "Se intentó registrar conjuntamente un medicamento ficticio y un insumo médico ficticio.",
      severity: "important",
    },
  ],
  barriers: [
    {
      id: "storage-record-completeness",
      competencyId: "storage-record-review",
      name: "Registro completo",
      description: "Barrera educativa para completar los campos visibles del registro ficticio.",
    },
  ],
  traps: [
    {
      id: "mixed-storage-domains-trap",
      triggerStageId: "choose-review-register",
      triggerOptionId: "open-combined-register",
      errorId: "mixed-storage-domains",
      revealStageIds: ["storage-result"],
      recoveryStageIds: [],
      patientImpactIfUnresolved: false,
    },
  ],
  stages: [
    {
      id: "storage-context",
      type: "context",
      title: "Inicio de revisión",
      area: "storage",
      competencyIds: [],
      content:
        "Comienza una revisión diaria ficticia. Los códigos, nombres y estados mostrados no corresponden al inventario institucional real.",
      interaction: {
        type: "continue",
        label: "Abrir pauta ficticia",
        nextStageId: "choose-review-register",
      },
    },
    {
      id: "choose-review-register",
      type: "storage-selection",
      title: "Seleccionar registro",
      area: "storage",
      competencyIds: ["storage-domain-separation"],
      content:
        "La actividad presenta registros separados para medicamentos ficticios e insumos médicos ficticios.",
      interaction: {
        type: "item-selection",
        prompt: "Selecciona el registro adecuado para el producto farmacológico ficticio F-102.",
        items: [
          { id: "medication-register", label: "Registro de medicamentos ficticios" },
          { id: "supply-register", label: "Registro de insumos médicos ficticios" },
          { id: "combined-register", label: "Registro combinado ficticio" },
        ],
        options: [
          {
            id: "open-medication-register",
            isCorrect: true,
            label: "Abrir registro de medicamentos ficticios",
            feedbackTiming: "immediate",
            feedback: "El escenario mantiene separados los dominios de medicamentos e insumos.",
            nextStageId: "review-storage-record",
          },
          {
            id: "open-supply-register",
            isCorrect: false,
            label: "Abrir registro de insumos médicos ficticios",
            feedbackTiming: "immediate",
            feedback: "El producto mostrado pertenece al registro ficticio de medicamentos. Revisa nuevamente.",
            nextStageId: "choose-review-register",
          },
          {
            id: "open-combined-register",
            isCorrect: false,
            label: "Abrir registro combinado ficticio",
            feedbackTiming: "immediate",
            feedback: "La actividad registra una mezcla de dominios y pide volver al registro separado.",
            effects: [{ type: "record-error", errorId: "mixed-storage-domains" }],
            nextStageId: "choose-review-register",
          },
        ],
      },
    },
    {
      id: "review-storage-record",
      type: "operational-check",
      title: "Revisión diaria ficticia",
      area: "storage",
      competencyIds: ["storage-record-review"],
      content: `${PROFESSIONAL_REVIEW_MARKER} Registro ficticio F-102: completa las comprobaciones visibles. No se evalúan condiciones clínicas ni se modifica inventario real.`,
      interaction: {
        type: "operational-check",
        prompt: "Completa las acciones observables del registro ficticio.",
        actions: [
          { id: "review-fictional-storage-code", label: "Comprobar el código ficticio del registro", required: true },
          { id: "review-fictional-storage-name", label: "Comprobar el nombre ficticio del producto", required: true },
          { id: "record-fictional-storage-state", label: "Registrar el estado de almacenamiento ficticio mostrado por la actividad", required: true },
          {
            id: "record-fictional-storage-observation",
            label: "Registrar una observación ficticia cuando corresponda",
            required: true,
            effects: [{ type: "activate-barrier", barrierId: "storage-record-completeness" }],
          },
        ],
        completeLabel: "Cerrar revisión ficticia",
        nextStageId: "storage-result",
      },
    },
    {
      id: "storage-result",
      type: "result",
      title: "Resultado de almacenamiento",
      area: "storage",
      competencyIds: ["storage-domain-separation", "storage-record-review"],
      content: "El resultado resume las acciones y la separación de dominios dentro del escenario ficticio.",
      interaction: { type: "continue", label: "Ver recordatorio", nextStageId: "storage-learning-card" },
    },
    {
      id: "storage-learning-card",
      type: "learning-card",
      title: "NO OLVIDAR",
      area: "storage",
      competencyIds: ["storage-domain-separation", "storage-record-review"],
      content: `${PROFESSIONAL_REVIEW_MARKER} Mantén separados los registros educativos de medicamentos e insumos. Ante una condición no prevista por el escenario, registra la situación y deriva la evaluación al QF.`,
      interaction: { type: "complete", label: "Finalizar revisión" },
    },
  ],
} satisfies TrainingCase;

export const case005StorageReview = assertValidTrainingCase(case005Definition, trainingCompetencies);
