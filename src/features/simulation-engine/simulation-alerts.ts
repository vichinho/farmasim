import type {
  DiscrepancyKind,
  ScenarioDefinition,
  SimulationEvent,
  SimulationSession,
  StorageDeviationKind,
} from "./types";

export type SimulationAlertCategory =
  | "process-deviation"
  | "medication-discrepancy"
  | "storage-deviation"
  | "safety-barrier-failure";

export type SimulationAlertKind = DiscrepancyKind | "storage" | "other";
export type SimulationAlertSeverity = "low" | "moderate" | "high";

export type SimulationAlertPayload = {
  sourceEventId: string;
  category: SimulationAlertCategory;
  kind: SimulationAlertKind;
  originStage: string;
  detectedAt: string;
  detectedBy: string;
  interceptedBy?: string;
  severity: SimulationAlertSeverity;
  reachedPatient: false;
  metadata: Record<string, string | number | boolean | null>;
};

const medicationKinds = new Set<DiscrepancyKind>([
  "medication",
  "strength",
  "pharmaceutical-form",
  "quantity",
  "omission",
  "additional-product",
]);

const discrepancyKinds = new Set<DiscrepancyKind>([
  "patient",
  "final-patient",
  "prescription",
  "prescription-status",
  "medication",
  "strength",
  "pharmaceutical-form",
  "quantity",
  "omission",
  "additional-product",
]);

function discrepancyOrigin(kind: DiscrepancyKind) {
  if (kind === "patient") return "clinical-system";
  if (kind === "final-patient") return "final-check";
  if (kind === "prescription" || kind === "prescription-status") return "prescription-review";
  return "preparation-check";
}

function discrepancySeverity(kind: DiscrepancyKind): SimulationAlertSeverity {
  if (medicationKinds.has(kind) || kind === "patient" || kind === "final-patient") return "high";
  return "moderate";
}

function storageSeverity(kind: StorageDeviationKind): SimulationAlertSeverity {
  if (kind === "mixed-product" || kind === "mixed-strength" || kind === "mixed-form") return "moderate";
  return "low";
}

function relevantStorageDetectionEvent(events: SimulationEvent[], drawerId: string) {
  return events.find((event) =>
    ["drawer.label_inspected", "drawer.opened", "drawer.contents_inspected"].includes(event.type)
    && event.data.drawerId === drawerId,
  );
}

function stringArray(value: SimulationEvent["data"][string]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isDiscrepancyKind(value: string): value is DiscrepancyKind {
  return discrepancyKinds.has(value as DiscrepancyKind);
}

export function simulationAlertsFromSession(
  scenario: ScenarioDefinition,
  session: SimulationSession,
): SimulationAlertPayload[] {
  const alerts: SimulationAlertPayload[] = [];
  const seenDiscrepancies = new Set<string>();
  const blockedEvents = session.eventLog.filter((event) => event.type === "delivery.blocked");

  // A blocked delivery is historical evidence. Do not depend on session.discrepancies,
  // because a later correction intentionally clears the active discrepancies before
  // the attempt is persisted.
  for (const blockedEvent of blockedEvents) {
    const ids = stringArray(blockedEvent.data.discrepancyIds);
    const kinds = stringArray(blockedEvent.data.discrepancyKinds);

    ids.forEach((discrepancyId, index) => {
      const kind = kinds[index];
      if (!kind || !isDiscrepancyKind(kind) || seenDiscrepancies.has(discrepancyId)) return;
      seenDiscrepancies.add(discrepancyId);

      const activeSnapshot = session.discrepancies.find((item) => item.id === discrepancyId);
      alerts.push({
        sourceEventId: `${blockedEvent.id}:${discrepancyId}`,
        category: medicationKinds.has(kind)
          ? "medication-discrepancy"
          : "process-deviation",
        kind,
        originStage: discrepancyOrigin(kind),
        detectedAt: blockedEvent.occurredAt,
        detectedBy: "safety-engine",
        interceptedBy: blockedEvent.actorId,
        severity: discrepancySeverity(kind),
        reachedPatient: false,
        metadata: {
          scenarioId: scenario.id,
          activeDispensingFacilityId: scenario.activeDispensingFacilityId,
          prescriptionLineId: activeSnapshot?.prescriptionLineId ?? null,
          trayItemId: activeSnapshot?.trayItemId ?? null,
        },
      });
    });
  }

  for (const deviation of session.storageDeviations) {
    const detectionEvent = relevantStorageDetectionEvent(session.eventLog, deviation.drawerId);
    if (!detectionEvent) continue;
    alerts.push({
      sourceEventId: `${detectionEvent.id}:${deviation.id}`,
      category: "storage-deviation",
      kind: "storage",
      originStage: "storage",
      detectedAt: detectionEvent.occurredAt,
      detectedBy: "storage-evaluator",
      interceptedBy: detectionEvent.actorId,
      severity: storageSeverity(deviation.kind),
      reachedPatient: false,
      metadata: {
        scenarioId: scenario.id,
        activeDispensingFacilityId: scenario.activeDispensingFacilityId,
        drawerId: deviation.drawerId,
        storageDeviationKind: deviation.kind,
      },
    });
  }

  const terminalEvent = session.eventLog.findLast((event) =>
    event.type === "delivery.completed" || event.type === "qf_support.requested",
  );
  if (terminalEvent) {
    for (const [criterionId, status] of Object.entries(session.criteria)) {
      if (status !== "reinforcement") continue;
      alerts.push({
        sourceEventId: `${terminalEvent.id}:${criterionId}`,
        category: "process-deviation",
        kind: "other",
        originStage: "process-evaluation",
        detectedAt: terminalEvent.occurredAt,
        detectedBy: "criteria-engine",
        interceptedBy: terminalEvent.actorId,
        severity: "low",
        reachedPatient: false,
        metadata: {
          scenarioId: scenario.id,
          activeDispensingFacilityId: scenario.activeDispensingFacilityId,
          criterionId,
        },
      });
    }
  }

  return alerts;
}
