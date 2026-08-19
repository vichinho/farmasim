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

export function simulationAlertsFromSession(
  scenario: ScenarioDefinition,
  session: SimulationSession,
): SimulationAlertPayload[] {
  const alerts: SimulationAlertPayload[] = [];
  const blockedEvents = session.eventLog.filter((event) => event.type === "delivery.blocked");
  const latestBlocked = blockedEvents.at(-1);

  if (latestBlocked) {
    for (const discrepancy of session.discrepancies) {
      alerts.push({
        sourceEventId: `${latestBlocked.id}:${discrepancy.id}`,
        category: medicationKinds.has(discrepancy.kind)
          ? "medication-discrepancy"
          : "process-deviation",
        kind: discrepancy.kind,
        originStage: discrepancyOrigin(discrepancy.kind),
        detectedAt: latestBlocked.occurredAt,
        detectedBy: "safety-engine",
        interceptedBy: latestBlocked.actorId,
        severity: discrepancySeverity(discrepancy.kind),
        reachedPatient: false,
        metadata: {
          scenarioId: scenario.id,
          activeDispensingFacilityId: scenario.activeDispensingFacilityId,
          prescriptionLineId: discrepancy.prescriptionLineId ?? null,
          trayItemId: discrepancy.trayItemId ?? null,
        },
      });
    }
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
