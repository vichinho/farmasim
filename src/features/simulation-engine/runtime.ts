import { evaluateSimulation } from "@/features/simulation-engine/engine";
import { SimulationEventLog } from "@/features/simulation-engine/event-log";
import {
  deriveRuntimeInventoryState,
  resolveMedicationStockSource,
} from "@/features/simulation-engine/inventory-state";
import type { RuntimeInventoryState } from "@/features/simulation-engine/inventory-state";
import {
  deriveRuntimeMaterialState,
  resolveMedicationPresentationId,
  runtimeEffectiveSession,
} from "@/features/simulation-engine/material-state";
import type { RuntimeMaterialState } from "@/features/simulation-engine/material-state";
import { validateScenarioSession } from "@/features/simulation-engine/scenario-validator";
import type {
  ScenarioDefinition,
  SimulationActionInput,
  SimulationDispatchReceipt,
  SimulationEvent,
  SimulationRuntimeSnapshot,
  SimulationRuntimeStatus,
  SimulationSession,
} from "@/features/simulation-engine/types";

const SYSTEM_SAFETY_ACTOR_ID = "system-safety";

export class SimulationRuntimeError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SimulationRuntimeError";
  }
}

function actionQuantity(action: SimulationActionInput): number {
  const value = action.metadata?.quantity;
  if (value === undefined) return 1;

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new SimulationRuntimeError(
      "invalid_quantity",
      `${action.type} metadata.quantity must be a positive integer.`,
    );
  }

  return value;
}

function materialQuantity(
  material: RuntimeMaterialState,
  location: "trayItems" | "heldItems",
  presentationId: string,
): number {
  return material[location].find((item) => item.presentationId === presentationId)?.quantity ?? 0;
}

function inventoryItemQuantity(
  inventory: RuntimeInventoryState,
  drawerId: string,
  itemId: string,
): number {
  return inventory.drawers
    .find((drawer) => drawer.drawerId === drawerId)
    ?.items.find((item) => item.itemId === itemId)?.quantity ?? 0;
}

function assertExternalActionTarget(session: SimulationSession, action: SimulationActionInput) {
  if (!session.actors.some((actor) => actor.id === action.actorId)) {
    throw new SimulationRuntimeError(
      "unknown_actor",
      `Actor ${action.actorId} does not exist in session ${session.id}.`,
    );
  }

  const requireTarget = (kind: string) => {
    if (!action.targetId) {
      throw new SimulationRuntimeError(
        "missing_target",
        `${action.type} requires a ${kind} targetId.`,
      );
    }
    return action.targetId;
  };

  if (action.type === "patient_record.opened") {
    const targetId = requireTarget("record");
    if (!session.records.some((record) => record.id === targetId)) {
      throw new SimulationRuntimeError("unknown_record", `Record ${targetId} is not part of this session.`);
    }
  }

  if (action.type === "prescription.opened" || action.type === "prescription.closed") {
    const targetId = requireTarget("prescription");
    if (!session.prescriptions.some((prescription) => prescription.id === targetId)) {
      throw new SimulationRuntimeError(
        "unknown_prescription",
        `Prescription ${targetId} is not part of this session.`,
      );
    }
  }

  if (
    action.type === "drawer.label_inspected" ||
    action.type === "drawer.opened" ||
    action.type === "drawer.contents_inspected"
  ) {
    const targetId = requireTarget("drawer");
    if (!session.drawers.some((drawer) => drawer.id === targetId)) {
      throw new SimulationRuntimeError("unknown_drawer", `Drawer ${targetId} is not part of this session.`);
    }
  }

  if (
    action.type === "medication.inspected" ||
    action.type === "medication.taken" ||
    action.type === "medication.returned" ||
    action.type === "medication.added_to_tray"
  ) {
    const targetId = requireTarget("medication");
    if (!resolveMedicationPresentationId(session, targetId)) {
      throw new SimulationRuntimeError(
        "unknown_medication",
        `Medication target ${targetId} is not part of this session.`,
      );
    }
  }

  if (
    action.type === "rut.typed" ||
    action.type === "identity.rechecked" ||
    action.type === "instructions.given" ||
    action.type === "delivery.attempted"
  ) {
    const targetId = requireTarget("patient");
    if (!session.patients.some((patient) => patient.id === targetId)) {
      throw new SimulationRuntimeError("unknown_patient", `Patient ${targetId} is not part of this session.`);
    }
  }

  if (action.type === "search.executed") {
    const resultPatientId = action.metadata?.resultPatientId;
    if (
      resultPatientId !== undefined &&
      (typeof resultPatientId !== "string" ||
        !session.patients.some((patient) => patient.id === resultPatientId))
    ) {
      throw new SimulationRuntimeError(
        "unknown_search_result_patient",
        "search.executed metadata.resultPatientId must reference a patient in this session.",
      );
    }
  }
}

function assertMaterialActionState(
  session: SimulationSession,
  events: readonly SimulationEvent[],
  action: SimulationActionInput,
) {
  if (
    action.type !== "medication.taken" &&
    action.type !== "medication.added_to_tray" &&
    action.type !== "medication.returned"
  ) {
    return;
  }

  const presentationId = resolveMedicationPresentationId(session, action.targetId);
  if (!presentationId) return;
  const quantity = actionQuantity(action);
  const material = deriveRuntimeMaterialState(session, events);

  if (action.type === "medication.taken") {
    const source = resolveMedicationStockSource(session, action.targetId, action.metadata);
    if (!source) {
      throw new SimulationRuntimeError(
        "medication_source_required",
        `Cannot take ${presentationId} because its source drawer/item is ambiguous or unavailable.`,
      );
    }

    const inventory = deriveRuntimeInventoryState(session, events);
    const available = inventoryItemQuantity(inventory, source.drawerId, source.itemId);
    if (available < quantity) {
      throw new SimulationRuntimeError(
        "insufficient_stock",
        `Cannot take ${quantity} of ${presentationId}; only ${available} remains in ${source.drawerId}.`,
      );
    }
  }

  if (action.type === "medication.added_to_tray") {
    const held = materialQuantity(material, "heldItems", presentationId);
    if (held < quantity) {
      throw new SimulationRuntimeError(
        "medication_not_held",
        `Cannot add ${quantity} of ${presentationId} to the tray because only ${held} is currently held.`,
      );
    }
  }

  if (action.type === "medication.returned") {
    const available =
      materialQuantity(material, "heldItems", presentationId) +
      materialQuantity(material, "trayItems", presentationId);
    if (available < quantity) {
      throw new SimulationRuntimeError(
        "medication_not_returnable",
        `Cannot return ${quantity} of ${presentationId}; only ${available} is held or on the tray.`,
      );
    }
  }
}

function deriveRuntimeStatus(events: readonly SimulationEvent[]): SimulationRuntimeStatus {
  if (events.some((event) => event.type === "delivery.completed")) return "completed";

  const lastEvent = events.at(-1);
  if (lastEvent?.type === "delivery.blocked") return "delivery-blocked";

  return "running";
}

export class SimulationRuntime {
  readonly #eventLog: SimulationEventLog;

  constructor(
    private readonly definition: ScenarioDefinition,
    private readonly session: SimulationSession,
  ) {
    const validation = validateScenarioSession(definition, session);
    if (!validation.valid) {
      throw new SimulationRuntimeError(
        "invalid_session",
        validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join(" | "),
      );
    }

    this.#eventLog = new SimulationEventLog(session.id);
  }

  dispatch(action: SimulationActionInput): SimulationDispatchReceipt {
    if (deriveRuntimeStatus(this.#eventLog.all()) === "completed") {
      throw new SimulationRuntimeError(
        "session_completed",
        `Session ${this.session.id} is already completed and cannot accept more actions.`,
      );
    }

    const previousEvents = this.#eventLog.all();
    assertExternalActionTarget(this.session, action);
    assertMaterialActionState(this.session, previousEvents, action);

    const actionEvent = this.#eventLog.append(action);
    const generatedEvents: SimulationEvent[] = [];

    if (action.type === "delivery.attempted") {
      const events = this.#eventLog.all();
      const material = deriveRuntimeMaterialState(this.session, events);
      const effectiveSession = runtimeEffectiveSession(this.session, material);
      const evaluation = evaluateSimulation(this.definition, effectiveSession, events, {
        validateConfiguration: false,
      });
      const generated = this.#eventLog.append({
        actorId: SYSTEM_SAFETY_ACTOR_ID,
        type: evaluation.safety.allowed ? "delivery.completed" : "delivery.blocked",
        targetType: action.targetType ?? "patient",
        targetId: action.targetId,
        metadata: {
          triggerEventId: actionEvent.id,
          blockingDiscrepancyIds: evaluation.safety.blockingDiscrepancyIds,
        },
        timestamp: action.timestamp,
      });
      generatedEvents.push(generated);
    }

    return {
      actionEvent,
      generatedEvents,
      snapshot: this.snapshot(),
    };
  }

  dispatchMany(actions: readonly SimulationActionInput[]): SimulationDispatchReceipt[] {
    return actions.map((action) => this.dispatch(action));
  }

  materialSnapshot(): RuntimeMaterialState {
    return deriveRuntimeMaterialState(this.session, this.#eventLog.all());
  }

  inventorySnapshot(): RuntimeInventoryState {
    return deriveRuntimeInventoryState(this.session, this.#eventLog.all());
  }

  snapshot(): SimulationRuntimeSnapshot {
    const events = this.#eventLog.all();
    const material = deriveRuntimeMaterialState(this.session, events);
    const effectiveSession = runtimeEffectiveSession(this.session, material);
    const evaluation = evaluateSimulation(this.definition, effectiveSession, events, {
      validateConfiguration: false,
    });

    return {
      sessionId: this.session.id,
      status: deriveRuntimeStatus(events),
      eventCount: events.length,
      events,
      state: evaluation.state,
      evaluation,
    };
  }
}
