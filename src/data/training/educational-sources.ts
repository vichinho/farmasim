import type { ContentApprovalRecord, EducationalSource } from "@/types/training-simulation";

/**
 * Registro de fuentes usadas por el contenido formativo. Identificar una fuente
 * no equivale a aprobar clínicamente una actividad: esa aprobación corresponde
 * al profesional responsable definido por la institución.
 */
export const educationalSources = [
  {
    id: "dispensing-evaluation-rubric-7-criteria",
    title: "Pauta de evaluación del proceso de dispensación de medicamentos en farmacia de atención abierta",
    versionLabel: "Pauta institucional, 7 criterios",
    authority: "institutional",
    reviewStatus: "approved-for-training",
  },
  {
    id: "daily-storage-review-rubric",
    title: "Revisión diaria de almacenamiento farmacia",
    versionLabel: "Pauta institucional",
    authority: "institutional",
    reviewStatus: "approved-for-training",
  },
  {
    id: "labeling-and-packaging-protocol-v6",
    title: "Protocolo procedimiento rotulación y envasado de medicamentos",
    versionLabel: "Versión 6, junio 2024",
    authority: "institutional",
    reviewStatus: "approved-for-training",
  },
  {
    id: "clinical-unit-request-and-dispatch-protocol-v8",
    title: "Solicitud y despacho de medicamentos e insumos desde unidades clínicas",
    versionLabel: "Versión 8, noviembre 2022",
    authority: "institutional",
    reviewStatus: "approved-for-training",
  },
  {
    id: "medication-prescription-format-v6",
    title: "Formato de prescripción de medicamentos",
    versionLabel: "Versión 6, noviembre 2022",
    authority: "institutional",
    reviewStatus: "approved-for-training",
  },
  {
    id: "medical-supplies-storage-protocol-v1",
    title: "Procedimiento almacenamiento y conservación de insumos médicos",
    versionLabel: "Versión 1, abril 2025",
    authority: "institutional",
    reviewStatus: "approved-for-training",
  },
  {
    id: "medications-storage-protocol-v1",
    title: "Protocolo de almacenamiento y conservación de medicamentos",
    versionLabel: "Versión 1, abril 2025",
    authority: "institutional",
    reviewStatus: "approved-for-training",
  },
  {
    id: "seminar-diagnosis-2026",
    title: "Diagnóstico y optimización de los procesos de dispensación en farmacia ambulatoria del Hospital de Tomé",
    versionLabel: "Seminario de título, borrador 2026",
    authority: "academic",
    reviewStatus: "approved-for-training",
  },
  {
    id: "arsenal-2026",
    title: "Arsenal farmacológico Hospital de Tomé 2026",
    versionLabel: "Catálogo 2026",
    authority: "catalog",
    reviewStatus: "approved-for-training",
  },
] satisfies EducationalSource[];

export const contentApproval = {
  approvedAt: "2026-08-14",
  approvedBy: "Profesional responsable institucional",
  scope:
    "Fuentes, criterios observables y escenarios educativos ficticios de los niveles 1 al 7.",
} satisfies ContentApprovalRecord;

export function getEducationalSource(sourceId: EducationalSource["id"]) {
  return educationalSources.find((source) => source.id === sourceId);
}
