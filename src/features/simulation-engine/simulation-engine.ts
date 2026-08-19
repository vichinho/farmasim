import { evaluateCriteria, emptyCriteria } from "./criteria-engine";
import { appendEvent } from "./event-log";
import {
  instructionEvidenceKey,
  missingInstructionSections,
  requiredInstructionSections,
} from "./instruction-engine";
import { canSafelyStopForPrescriptionReview } from "./prescription-status";
import { buildExpectedTray, evaluateDeliverySafety } from "./safety-engine";
import { assertValidScenarioDefinition } from "./scenario-validator";
import { evaluateStorage } from "./storage-evaluator";
import type {
  ActorController,
  InstructionSection,
  PlayerRole,
  PrescriptionDisposition,
  ScenarioDefinition,
  SimulationCommand,
  SimulationEvent,
  SimulationSession,
} from "./types";

function normalizeRut(value: string) {
  return value.toUpperCase().replace(/[^0-9K]/g, "");
}

function controllersForRole(role: PlayerRole): Record<string, ActorController> {
  return role === "tens-1"
    ? { "tens-1": "participant", "tens-2": "simulation", "qf-support": "simulation" }
    : { "tens-1": "simulation", "tens-2": "participant", "qf-support": "simulation" };
}

const controllersBeforeRoleSelection: Record<string, ActorController> = {
  "tens-1": "simulation",
  "tens-2": "simulation",
  "qf-support": "simulation",
};

export function createSimulationSession(
  scenarioInput: ScenarioDefinition,
  options?: { sessionId?: string; startedAt?: string },
): SimulationSession {
  const scenario = assertValidScenarioDefinition(scenarioInput);
  const initialActor = scenario.actors.find((actor) => actor.id === "tens-1") ?? scenario.actors[0];
  if (!initialActor) throw new Error("Scenario has no actors");
  const startedAt = options?.startedAt ?? new Date().toISOString();

  return {
    id: options?.sessionId ?? crypto.randomUUID(),
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    seed: scenario.seed,
    mode: scenario.mode,
    activeActorId: initialActor.id,
    selectedPlayerRole: null,
    actorControllers: { ...controllersBeforeRoleSelection },
    focusedObjectId: null,
    focusReturnObjectId: null,
    typedRut: "",
    loadedPatientId: scenario.initialClinicalSystemState === "previous_patient_open"
      ? scenario.similarPatients[0]?.id ?? null
      : null,
    finalReidentifiedPatientId: null,
    openedPrescriptionIds: [],
    verifiedPrescriptionIds: [],
    prescriptionDispositionById: {},
    inspectedMedicationIds: [],
    comparedPrescriptionLineIds: [],
    instructionEvidenceKeys: [],
    missingInstructionSections: missingInstructionSections(scenario, []),
    openedTabIds: [],
    scrolledRecordIds: [],
    tray: structuredClone(scenario.initialTray),
    eventLog: [],
    discrepancies: [],
    storageDeviations: evaluateStorage(scenario),
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
      if (session.deliveryStatus === "blocked") next.deliveryStatus = "not-attempted";
      break;
    case "drawer.opened":
      next.focusedObjectId = `drawer:${value(event, "drawerId") ?? "unknown"}`;
      break;
    case "medication.inspected": {
      const id = value(event, "medicationPresentationId");
      next.focusReturnObjectId = session.focusedObjectId;
      next.focusedObjectId = `medication:${id ?? "unknown"}`;
      if (id) next.inspectedMedicationIds = Array.from(new Set([...next.inspectedMedicationIds, id]));
      break;
    }
    case "medication.compared_to_prescription": {
      const lineId = value(event, "prescriptionLineId");
      if (lineId) next.comparedPrescriptionLineIds = Array.from(new Set([...next.comparedPrescriptionLineIds, lineId]));
      break;
    }
    case "instruction.section_given": {
      const lineId = value(event, "prescriptionLineId");
      const section = value(event, "section") as InstructionSection | null;
      if (lineId && section && requiredInstructionSections.includes(section)) {
        next.instructionEvidenceKeys = Array.from(new Set([
          ...next.instructionEvidenceKeys,
          instructionEvidenceKey(lineId, section),
        ]));
      }
      break;
    }
    case "identity.rechecked":
      next.finalReidentifiedPatientId = value(event, "patientId");
      break;
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
    case "tab.opened": {
      const tabId = value(event, "tabId");
      if (tabId) next.openedTabIds = Array.from(new Set([...next.openedTabIds, tabId]));
      break;
    }
    case "record.scrolled": {
      const recordId = value(event, "recordId");
      if (recordId) next.scrolledRecordIds = Array.from(new Set([...next.scrolledRecordIds, recordId]));
      break;
    }
    case "prescription.opened": {
      const id = value(event, "prescriptionId");
      if (id) next.openedPrescriptionIds = Array.from(new Set([...next.openedPrescriptionIds, id]));
      break;
    }
    case "prescription.closed": {
      const id = value(event, "prescriptionId");
      next.openedPrescriptionIds = next.openedPrescriptionIds.filter((prescriptionId) => prescriptionId !== id);
      break;
    }
    case "prescription.status_verified": {
      const id = value(event, "prescriptionId");
      const disposition = value(event, "disposition") as PrescriptionDisposition | null;
      if (id) {
        next.verifiedPrescriptionIds = Array.from(new Set([...next.verifiedPrescriptionIds, id]));
        if (disposition === "proceed" || disposition === "hold-for-review") {
          next.prescriptionDispositionById = {
            ...next.prescriptionDispositionById,
            [id]: disposition,
          };
        }
      }
      break;
    }
    case "role.selected": {
      const selectedRaw = value(event, "selectedRole") ?? value(event, "selectedActorId");
      const selected = selectedRaw as PlayerRole | null;
      if (selected === "tens-1" || selected === "tens-2") {
        next.selectedPlayerRole = selected;
        next.activeActorId = selected;
        next.actorControllers = controllersForRole(selected);
      }
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
    case "qf_support.requested":
      if (canSafelyStopForPrescriptionReview(scenario, next.eventLog)) {
        next.deliveryStatus = "safely-stopped";
        next.discrepancies = [];
      }
      break;
    case "delivery.blocked":
      next.deliveryStatus = "blocked";
      break;
    case "delivery.completed":
      next.deliveryStatus = "completed";
      break;
  }

  next.missingInstructionSections = missingInstructionSections(scenario, next.eventLog);
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

  if (session.deliveryStatus === "completed" || session.deliveryStatus === "safely-stopped") {
    return session;
  }

  if (!session.selectedPlayerRole && command.type !== "role.selected") return session;
  if (session.selectedPlayerRole && command.type === "role.selected") return session;

  if (command.type === "role.selected") {
    const selectedRaw = command.data?.selectedRole ?? command.data?.selectedActorId;
    const selected = selectedRaw === "tens-1" || selectedRaw === "tens-2"
      ? selectedRaw
      : null;
    if (!selected) return session;
    if (scenario.requiredPlayerRole && selected !== scenario.requiredPlayerRole) return session;
  }

  const actor = scenario.actors.find((candidate) => candidate.id === command.actorId);
  if (!actor) throw new Error(`Unknown actor: ${command.actorId}`);

  // A participant-controlled TENS 2 must correct the tray manually by returning
  // and adding products. The one-click expected-tray replacement is reserved for
  // the simulated counterpart when TENS 1 is the participant.
  if (command.type === "tray.corrected" && session.actorControllers[command.actorId] === "participant") {
    return session;
  }

  let next = reduceEvent(scenario, session, appendEvent(session, command, occurredAt));

  if (command.type === "delivery.attempted") {
    const discrepancies = evaluateDeliverySafety(scenario, next);
    next = { ...next, discrepancies };
    const outcome: SimulationCommand = {
      type: discrepancies.length ? "delivery.blocked" : "delivery.completed",
      actorId: command.actorId,
      data: {
        discrepancyIds: discrepancies.map((item) => item.id),
        discrepancyKinds: discrepancies.map((item) => item.kind),
      },
    };
    next = reduceEvent(scenario, next, appendEvent(next, outcome, occurredAt));
  }

  return next;
}