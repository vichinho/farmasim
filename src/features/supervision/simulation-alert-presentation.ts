import type { Json } from "@/types/database";

type AlertPresentationInput = {
  category?: string | null;
  kind: string;
  metadata?: Json | null;
  originStage: string;
  severity?: string | null;
};

const kindLabels: Record<string, string> = {
  patient: "Paciente incorrecto en sistema",
  "final-patient": "Reidentificación final no coincidente",
  prescription: "Prescripción no válida para el retiro",
  "prescription-status": "Estado de prescripción requiere revisión",
  medication: "Medicamento incorrecto",
  strength: "Concentración incorrecta",
  "pharmaceutical-form": "Forma farmacéutica incorrecta",
  quantity: "Cantidad incorrecta",
  omission: "Medicamento omitido",
  "additional-product": "Producto adicional en bandeja",
  storage: "Desviación de almacenamiento",
};

const criterionLabels: Record<string, string> = {
  "criterion-1-request-identity-document": "Solicitud de identificación incompleta",
  "criterion-2-system-identity-match": "Identificación del paciente incompleta",
  "criterion-3-identify-all-prescriptions": "Revisión de prescripciones incompleta",
  "criterion-4-confirm-prescription-issued": "Validación de prescripción incompleta",
  "criterion-5-compare-prepared-items": "Desviación de preparación interceptada",
  "criterion-6-recheck-identity-before-handoff": "Reidentificación final incompleta",
  "criterion-7-provide-corresponding-instructions": "Indicaciones al paciente incompletas",
};

const originLabels: Record<string, string> = {
  "clinical-system": "Identificación en sistema",
  "final-check": "Verificación final de identidad",
  "prescription-review": "Revisión de prescripciones",
  "preparation-check": "Verificación de preparación",
  storage: "Almacenamiento",
  "process-evaluation": "Evaluación del proceso",
};

const categoryLabels: Record<string, string> = {
  "process-deviation": "Desviación de proceso",
  "medication-discrepancy": "Discrepancia de medicamento",
  "storage-deviation": "Desviación de almacenamiento",
  "safety-barrier-failure": "Barrera de seguridad",
};

const severityLabels: Record<string, string> = {
  low: "Baja",
  moderate: "Moderada",
  high: "Alta",
};

function metadataString(metadata: Json | null | undefined, key: string) {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") return undefined;
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
}

export function presentSimulationAlert(alert: AlertPresentationInput) {
  const criterionId = metadataString(alert.metadata, "criterionId");
  const title = kindLabels[alert.kind]
    ?? (criterionId ? criterionLabels[criterionId] : undefined)
    ?? (alert.originStage === "preparation-check" ? "Desviación de preparación interceptada" : "Desviación del proceso de dispensación");

  return {
    title,
    originLabel: originLabels[alert.originStage] ?? "Etapa de simulación",
    categoryLabel: alert.category ? categoryLabels[alert.category] ?? "Alerta de simulación" : "Alerta de simulación",
    severityLabel: alert.severity ? severityLabels[alert.severity] ?? "No especificada" : "No especificada",
  };
}
