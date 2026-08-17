import type { SimulationEvent, SimulationSession, SimulationState } from "@/features/simulation-engine/types";

export function deriveSimulationState(
  session: SimulationSession,
  events: readonly SimulationEvent[],
): SimulationState {
  let activePatientId: string | null = null;

  switch (session.initialClinicalSystemState.type) {
    case "previous_patient_open":
    case "previous_tab_open":
    case "previous_prescription_open":
      activePatientId = session.initialClinicalSystemState.patientId;
      break;
    case "clean_search":
      break;
  }

  const openedRecordIds = new Set<string>();
  const openedPrescriptionIds = new Set<string>();
  const inspectedMedicationItemIds = new Set<string>();
  const openedDrawerIds = new Set<string>();
  let trayInspected = false;
  let deliveryAttempted = false;
  let qfSupportRequested = false;

  for (const event of events) {
    if (event.type === "search.executed") {
      const resultPatientId = event.metadata?.resultPatientId;
      if (typeof resultPatientId === "string") activePatientId = resultPatientId;
    }

    if (event.type === "patient_record.opened" && event.targetId) {
      openedRecordIds.add(event.targetId);
      const record = session.records.find((item) => item.id === event.targetId);
      if (record) activePatientId = record.patientId;
    }

    if (event.type === "prescription.opened" && event.targetId) {
      openedPrescriptionIds.add(event.targetId);
    }

    if (event.type === "medication.inspected" && event.targetId) {
      inspectedMedicationItemIds.add(event.targetId);
    }

    if (event.type === "drawer.opened" && event.targetId) {
      openedDrawerIds.add(event.targetId);
    }

    if (event.type === "tray.inspected") trayInspected = true;
    if (event.type === "delivery.attempted") deliveryAttempted = true;
    if (event.type === "qf_support.requested") qfSupportRequested = true;
  }

  return {
    activePatientId,
    openedRecordIds: [...openedRecordIds],
    openedPrescriptionIds: [...openedPrescriptionIds],
    inspectedMedicationItemIds: [...inspectedMedicationItemIds],
    openedDrawerIds: [...openedDrawerIds],
    trayInspected,
    deliveryAttempted,
    qfSupportRequested,
  };
}
