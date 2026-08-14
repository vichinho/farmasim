import type { DispensingCriterion } from "@/types/training-simulation";

/**
 * Traducción pedagógica de los siete criterios observables de la pauta.
 * Los textos describen evidencia operativa dentro de una simulación; no son
 * instrucciones clínicas ni autorizan a modificar una prescripción.
 */
export const dispensingCriteria = [
  {
    id: "criterion-1-request-identity-document",
    title: "Solicitar documento de identidad y/o tarjeta de crónico",
    observableAction: "Registra que el participante solicita el identificador ficticio requerido antes de revisar la solicitud.",
    sourceId: "dispensing-evaluation-rubric-7-criteria",
    trainingBoundary: "La simulación utiliza datos ficticios y no verifica identidad de personas reales.",
  },
  {
    id: "criterion-2-system-identity-match",
    title: "Ingresar RUT y verificar el nombre mostrado por el sistema",
    observableAction: "Registra la comparación entre el identificador ficticio ingresado y el nombre ficticio mostrado en el sistema.",
    sourceId: "dispensing-evaluation-rubric-7-criteria",
    trainingBoundary: "No reemplaza controles institucionales ni usa sistemas clínicos reales.",
  },
  {
    id: "criterion-3-identify-all-prescriptions",
    title: "Identificar todas las prescripciones disponibles para la persona usuaria",
    observableAction: "Registra la revisión completa del conjunto de prescripciones ficticias disponible en el caso.",
    sourceId: "dispensing-evaluation-rubric-7-criteria",
    trainingBoundary: "No solicita interpretación clínica de prescripciones; cualquier duda se deriva al QF.",
  },
  {
    id: "criterion-4-confirm-prescription-issued",
    title: "Verificar que la receta esté emitida",
    observableAction: "Registra la comprobación operativa del estado de emisión ficticio mostrado por el sistema.",
    sourceId: "dispensing-evaluation-rubric-7-criteria",
    trainingBoundary: "No implica validación clínica, modificación ni autorización de una prescripción.",
  },
  {
    id: "criterion-5-compare-prepared-items",
    title: "Comparar los medicamentos preparados con la receta",
    observableAction: "Registra la comparación visible de nombre, concentración, forma farmacéutica y cantidad en elementos ficticios.",
    sourceId: "dispensing-evaluation-rubric-7-criteria",
    trainingBoundary: "Ante una discrepancia o duda, el caso debe detener el despacho y escalar al QF.",
  },
  {
    id: "criterion-6-recheck-identity-before-handoff",
    title: "Verificar nuevamente la identidad antes de la entrega",
    observableAction: "Registra una segunda comprobación del identificador y nombre ficticios antes del cierre de la atención.",
    sourceId: "dispensing-evaluation-rubric-7-criteria",
    trainingBoundary: "La comprobación ocurre solo dentro del escenario educativo con información ficticia.",
  },
  {
    id: "criterion-7-provide-corresponding-instructions",
    title: "Entregar las indicaciones correspondientes a cada medicamento",
    observableAction: "Registra que el participante selecciona la orientación ficticia autorizada por el escenario.",
    sourceId: "dispensing-evaluation-rubric-7-criteria",
    trainingBoundary: "No genera consejo clínico ni reemplaza la orientación de un profesional autorizado.",
  },
] satisfies DispensingCriterion[];

export function getDispensingCriterion(criterionId: DispensingCriterion["id"]) {
  return dispensingCriteria.find((criterion) => criterion.id === criterionId);
}
