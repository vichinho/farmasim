import type {
  ScenarioDefinition,
  SimulationEvent,
  SimulationEventType,
  SimulationSession,
} from "./types";

export type MissionStepStatus = "completed" | "current" | "pending" | "attention";

export type MissionStep = {
  id: string;
  label: string;
  description: string;
  status: MissionStepStatus;
};

const eventLabels: Record<SimulationEventType, string> = {
  "document.requested": "Solicitaste el documento del paciente",
  "document.opened": "Revisaste la identificación del paciente",
  "computer.focused": "Consultaste el computador clínico",
  "rut.typed": "Ingresaste el RUT del paciente",
  "search.executed": "Buscaste al paciente por su RUT",
  "patient_record.opened": "Abriste la ficha del paciente",
  "tab.opened": "Abriste una sección del sistema clínico",
  "record.scrolled": "Revisaste el contenido de la ficha",
  "prescription.opened": "Abriste una prescripción",
  "prescription.closed": "Cerraste una prescripción",
  "prescription.status_verified": "Verificaste el estado de una prescripción",
  "computer.exited": "Terminaste la consulta en el computador",
  "storage.focused": "Fuiste al área de almacenamiento",
  "drawer.label_inspected": "Leíste el rótulo de una gaveta",
  "drawer.opened": "Abriste una gaveta",
  "drawer.contents_inspected": "Revisaste el contenido de una gaveta",
  "medication.inspected": "Inspeccionaste un medicamento",
  "medication.compared_to_prescription": "Comparaste el medicamento con su prescripción",
  "medication.taken": "Seleccionaste un medicamento",
  "medication.returned": "Retiraste un producto de la bandeja",
  "medication.added_to_tray": "Agregaste un medicamento a la bandeja",
  "tray.sent": "Enviaste la bandeja a atención",
  "tray.received": "Recibiste la bandeja preparada",
  "tray.inspected": "Revisaste la bandeja",
  "tray.corrected": "TENS 2 corrigió la preparación",
  "correction.requested": "Solicitaste corregir la preparación",
  "identity.rechecked": "Confirmaste nuevamente la identidad",
  "instructions.given": "Entregaste las indicaciones al paciente",
  "qf_support.requested": "Solicitaste apoyo al químico farmacéutico",
  "delivery.attempted": "Intentaste entregar la preparación",
  "delivery.blocked": "La barrera de seguridad detuvo la entrega",
  "delivery.completed": "Completaste la entrega de forma segura",
  "patient.focused": "Te acercaste al paciente",
  "preparation.focused": "Te acercaste al área de preparación",
  "scene.returned": "Volviste a la farmacia",
  "role.selected": "Cambiaste el rol activo",
};

const learnerVisibleEvents = new Set<SimulationEventType>([
  "document.opened",
  "computer.focused",
  "patient_record.opened",
  "prescription.status_verified",
  "storage.focused",
  "drawer.label_inspected",
  "drawer.contents_inspected",
  "medication.inspected",
  "medication.compared_to_prescription",
  "medication.added_to_tray",
  "tray.inspected",
  "correction.requested",
  "tray.corrected",
  "identity.rechecked",
  "instructions.given",
  "delivery.blocked",
  "delivery.completed",
]);

export function describeSimulationEvent(event: SimulationEvent) {
  return eventLabels[event.type];
}

export function getRecentLearnerActions(events: SimulationEvent[], limit = 4) {
  const result: Array<{ id: string; label: string }> = [];

  for (const event of events.toReversed()) {
    if (!learnerVisibleEvents.has(event.type)) continue;
    const label = describeSimulationEvent(event);
    if (result.some((item) => item.label === label)) continue;
    result.push({ id: event.id, label });
    if (result.length === limit) break;
  }

  return result;
}

export function getMissionSteps(
  scenario: ScenarioDefinition,
  session: SimulationSession,
): MissionStep[] {
  const hasEvent = (type: SimulationEventType) => session.eventLog.some((event) => event.type === type);

  if (scenario.mode === "practice") {
    return [
      {
        id: "practice-objective",
        label: "Completa una dispensación segura",
        description: "Explora la escena y utiliza las fuentes disponibles cuando las necesites.",
        status: session.deliveryStatus === "completed" ? "completed" : session.deliveryStatus === "blocked" ? "attention" : "current",
      },
    ];
  }

  const allRelevantPrescriptionsVerified = scenario.prescriptionsRelevantToCurrentWithdrawal.every((id) =>
    session.verifiedPrescriptionIds.includes(id),
  );
  const allRelevantLinesCompared = scenario.prescriptions
    .filter((record) => scenario.prescriptionsRelevantToCurrentWithdrawal.includes(record.id))
    .flatMap((record) => record.lines)
    .every((line) => session.comparedPrescriptionLineIds.includes(line.id));
  const identityConfirmed = hasEvent("identity.rechecked") && hasEvent("instructions.given");
  const conditions = [
    hasEvent("document.opened"),
    session.loadedPatientId === scenario.patient.id && allRelevantPrescriptionsVerified,
    hasEvent("tray.inspected") && allRelevantLinesCompared,
    identityConfirmed,
    session.deliveryStatus === "completed",
  ];
  const currentIndex = conditions.findIndex((completed) => !completed);

  const steps = [
    ["identify", "Identifica al paciente", "Solicita y revisa su documento."],
    ["prescriptions", "Revisa las prescripciones", "Confirma la ficha, estado y medicamentos indicados."],
    ["tray", "Verifica la preparación", "Inspecciona y compara cada producto con su prescripción."],
    ["confirm", "Confirma antes de entregar", "Revalida la identidad y entrega las indicaciones."],
    ["deliver", "Completa la entrega", "Entrega solo cuando la preparación sea segura."],
  ] as const;

  return steps.map(([id, label, description], index) => ({
    id,
    label,
    description:
      id === "deliver" && session.deliveryStatus === "blocked"
        ? "Entrega detenida: revisa la causa detectada antes de continuar."
        : description,
    status: conditions[index]
      ? "completed"
      : id === "deliver" && session.deliveryStatus === "blocked"
        ? "attention"
        : index === currentIndex
          ? "current"
          : "pending",
  }));
}
