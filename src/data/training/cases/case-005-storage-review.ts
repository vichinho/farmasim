import { trainingCompetencies } from "@/data/training/competencies";
import { assertValidTrainingCase } from "@/data/training/validate-training-case";
import { CONTENT_TRACEABILITY_NOTE, type TrainingCase } from "@/types/training-simulation";

const case005Definition = {
  id: "case-005-storage-review",
  version: "1.0.0-demo",
  levelId: "level-5",
  title: "Caso 005 - Revisión de almacenamiento",
  description:
    "Caso ficticio para practicar el registro diario de almacenamiento de medicamentos.",
  contentValidation: "educational-development",
  traceability: {
    createdAt: "2026-08-14",
    medicationUsed: "Producto farmacológico F-102 (ficticio)",
    observations:
      "La pauta se centra en medicamentos. La distinción con insumos se incorporará solo cuando un escenario cuente con fuente y objetivo educativo específicos.",
    relatedProtocolIds: ["daily-storage-review-rubric", "medications-storage-protocol-v1"],
    sourceIds: ["daily-storage-review-rubric", "medications-storage-protocol-v1", "arsenal-2026"],
    status: "documented-base",
    statement: CONTENT_TRACEABILITY_NOTE,
    scope: "Registro diario educativo de almacenamiento de medicamentos.",
  },
  initialStageId: "storage-context",
  context: {
    timeLabel: "07:45 h",
    location: "Área de almacenamiento ficticia",
    patientDescription: "Sin atención de paciente: revisión interna ficticia de almacenamiento.",
  },
  competencies: ["storage-record-review"],
  errors: [],
  barriers: [
    {
      id: "storage-record-completeness",
      competencyId: "storage-record-review",
      name: "Registro completo",
      description: "Barrera educativa para completar los campos visibles del registro ficticio.",
    },
  ],
  traps: [],
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
        nextStageId: "review-storage-record",
      },
    },
    {
      id: "review-storage-record",
      type: "operational-check",
      title: "Revisión diaria ficticia",
      area: "storage",
      competencyIds: ["storage-record-review"],
      content: `${CONTENT_TRACEABILITY_NOTE} Registro ficticio F-102: completa las comprobaciones visibles. No se evalúan condiciones clínicas ni se modifica inventario real.`,
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
      competencyIds: ["storage-record-review"],
      content: "El resultado resume las acciones del registro dentro del escenario ficticio.",
      interaction: { type: "continue", label: "Ver recordatorio", nextStageId: "storage-learning-card" },
    },
    {
      id: "storage-learning-card",
      type: "learning-card",
      title: "NO OLVIDAR",
      area: "storage",
      competencyIds: ["storage-record-review"],
      content: "Registra las observaciones visibles del escenario educativo. Ante una condición no prevista, detén la actividad y deriva la situación al QF según el protocolo aplicable.",
      interaction: { type: "complete", label: "Finalizar revisión" },
    },
  ],
} satisfies TrainingCase;

export const case005StorageReview = assertValidTrainingCase(case005Definition, trainingCompetencies);
