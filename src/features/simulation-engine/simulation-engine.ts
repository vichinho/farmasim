import { evaluateCriteria, emptyCriteria } from "./criteria-engine";
import { appendEvent } from "./event-log";
import { buildExpectedTray, evaluateDeliverySafety } from "./safety-engine";
import { assertValidScenarioDefinition } from "./scenario-validator";
import type {
  ScenarioDefinition,
  SimulationCommand,
  SimulationEvent,
  SimulationSession,
} from "./types";

function normalizeRut(value: string) {
  return value.toUpperCase().replace(/[^0-9K]/g, "");
}

export function createSimulationSession(
  scenarioInput: ScenarioDefinition,
  options?: { sessionId?: string; startedAt?: string },
): SimulationSession {
  const scenario = assertValidScenarioDefinition(scenarioInput);
  const participant = scenario.actors.find((actor) => actor.controller === "participant");
  if (!participant) throw new Error("Scenario has no participant actor");
  const startedAt = options?.startedAt ?? new Date().toISOString();

  return {
    id: options?.sessionId ?? crypto.randomUUID(),
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    seed: scenario.seed,
    mode: scenario.mode,
    activeActorId: participant.id,
    focusedObjectId: null,
    focusReturnObjectId: null,
    typedRut: "",
    loadedPatientId: null,
    openedPrescriptionIds: [],
    verifiedPrescriptionIds: [],
    inspectedMedicationIds: [],
    tray: structuredClone(scenario.initialTray),
    eventLog: [],
    discrepancies: [],
    criteria: emptyCriteria(),
    deliveryStatus: "not-attempted",
    startedAt,
    updatedAt: startedAt,
  };
}

function value(event: SimulationEvent, key: string) {
  const result = event.data[key];
  return typeof result === "string" ? result : null;
}

function reduceEvent(
  scenario: ScenarioDefinition,
  session: SimulationSession,
  event: SimulationEvent,
): SimulationSession {
  const next: SimulationSession = {
    ...session,
    eventLog: [...session.eventLog, event],
    updatedAt: event.occurredAt,
  };

  switch (event.type) {
    case "patient.focused":
      next.focusedObjectId = "patient";
      break;
    case "preparation.focused":
      next.focusedObjectId = "preparation";
      break;
    case "computer.focused":
      next.focusedObjectId = "computer";
      break;
    case "storage.focused":
      next.focusedObjectId = "storage";
      break;
    case "document.opened":
      next.focusedObjectId = "document";
      break;
    case "tray.inspected":
      next.focusedObjectId = "tray";
      if (session.deliveryStatus === "blocked") {
        next.deliveryStatus = "not-attempted";
      }
      break;
    case "drawer.opened":
      next.focusedObjectId = `drawer:${value(event, "drawerId") ?? "unknown"}`;
      break;
    case "medication.inspected": {
      const id = value(event, "medicationPresentationId");
      next.focusReturnObjectId = session.focusedObjectId;
      next.focusedObjectId = `medication:${id ?? "unknown"}`;
      if (id) {
        next.inspectedMedicationIds = Array.from(new Set([...next.inspectedMedicationIds, id]));
      }
      break;
    }
    case "scene.returned":
    case "computer.exited":
      next.focusedObjectId = null;
      next.focusReturnObjectId = null;
      break;
    case "rut.typed":
      next.typedRut = value(event, "rut") ?? "";
      break;
    case "search.executed": {
      const searchedRut = value(event, "rut") ?? next.typedRut;
      const match = [scenario.patient, ...scenario.similarPatients].find(
        (patient) => normalizeRut(patient.rut) === normalizeRut(searchedRut),
      );
      next.loadedPatientId = match?.id ?? null;
      break;
    }
    case "patient_record.opened":
      next.loadedPatientId = value(event, "patientId");
      break;
    case "prescription.opened": {
      const id = value(event, "prescriptionId");
      if (id) next.openedPrescriptionIds = Array.from(new Set([...next.openedPrescriptionIds, id]));
      break;
    }
    case "prescription.closed": {
      const id = value(event, "prescriptionId");
      next.openedPrescriptionIds = next.openedPrescriptionIds.filter(
        (prescriptionId) => prescriptionId !== id,
      );
      break;
    }
    case "prescription.status_verified": {
      const id = value(event, "prescriptionId");
      if (id) next.verifiedPrescriptionIds = Array.from(new Set([...next.verifiedPrescriptionIds, id]));
      break;
    }
    case "role.selected": {
      const actorId = value(event, "selectedActorId");
      if (actorId) next.activeActorId = actorId;
      break;
    }
    case "medication.added_to_tray": {
      const itemId = value(event, "trayItemId");
      const presentationId = value(event, "medicationPresentationId");
      if (itemId && presentationId) {
        next.tray = {
          ...next.tray,
          status: "preparing",
          items: [
            ...next.tray.items,
            {
              id: itemId,
              prescriptionLineId: value(event, "prescriptionLineId") ?? undefined,
              medicationPresentationId: presentationId,
              quantity: Number(event.data.quantity ?? 1),
            },
          ],
        };
      }
      break;
    }
    case "medication.returned": {
      const itemId = value(event, "trayItemId");
      next.tray = { ...next.tray, items: next.tray.items.filter((item) => item.id !== itemId) };
      break;
    }
    case "tray.sent":
      next.tray = { ...next.tray, status: "sent" };
      break;
    case "tray.received":
      next.tray = { ...next.tray, status: "received" };
      break;
    case "correction.requested":
      next.tray = { ...next.tray, status: "correction-requested" };
      break;
    case "tray.corrected":
      next.tray = buildExpectedTray(scenario);
      next.discrepancies = [];
      next.deliveryStatus = "not-attempted";
      break;
    case "delivery.blocked":
      next.deliveryStatus = "blocked";
      break;
    case "delivery.completed":
      next.deliveryStatus = "completed";
      break;
  }

  next.criteria = evaluateCriteria(scenario, next.eventLog);
  return next;
}

export function executeSimulationCommand(
  scenario: ScenarioDefinition,
  session: SimulationSession,
  command: SimulationCommand,
  occurredAt?: string,
): SimulationSession {
  if (session.scenarioId !== scenario.id) throw new Error("Session and scenario do not match");
  const actor = scenario.actors.find((candidate) => candidate.id === command.actorId);
  if (!actor) throw new Error(`Unknown actor: ${command.actorId}`);

  let next = reduceEvent(scenario, session, appendEvent(session, command, occurredAt));

  if (command.type === "delivery.attempted") {
    const discrepancies = evaluateDeliverySafety(scenario, next);
    next = { ...next, discrepancies };
    const outcome: SimulationCommand = {
      type: discrepancies.length ? "delivery.blocked" : "delivery.completed",
      actorId: command.actorId,
      data: { discrepancyIds: discrepancies.map((item) => item.id) },
    };
    next = reduceEvent(scenario, next, appendEvent(next, outcome, occurredAt));
  }

  return next;
}
