import { deriveRuntimeHandoffState } from "@/features/simulation-engine/handoff-state";
import { deriveRuntimeInventoryState } from "@/features/simulation-engine/inventory-state";
import { deriveRuntimeMaterialState } from "@/features/simulation-engine/material-state";
import { deriveRuntimePreparationWorkflow } from "@/features/simulation-engine/preparation-workflow";
import { deriveSimulationState } from "@/features/simulation-engine/state";
import type {
  SimulationActionInput,
  SimulationEvent,
  SimulationRuntimeStatus,
  SimulationSession,
} from "@/features/simulation-engine/types";

export const SIMULATION_INTEGRATION_CONTRACT_VERSION = 1 as const;

export type SimulationPlayerActionInput = Omit<SimulationActionInput, "actorId">;

export type SimulationIntegrationCapabilities = {
  readOnly: boolean;
  canUseClinicalSystem: boolean;
  canAccessStorage: boolean;
  canModifyTray: boolean;
  canConfirmPreparation: boolean;
  canSendTray: boolean;
  canReceiveTray: boolean;
  canInspectTray: boolean;
  canRequestCorrection: boolean;
  canAttemptDelivery: boolean;
};

export type SimulationIntegrationSnapshot = {
  contractVersion: typeof SIMULATION_INTEGRATION_CONTRACT_VERSION;
  session: {
    id: string;
    mode: SimulationSession["mode"];
    playerRole: SimulationSession["playerRole"];
    status: SimulationRuntimeStatus;
    eventCount: number;
    lastEventType: SimulationEvent["type"] | null;
  };
  player: {
    actorId: string;
    role: SimulationSession["playerRole"];
  };
  patients: Array<{
    id: string;
    displayName: string;
    syntheticRut: string;
    age: number;
  }>;
  facilities: SimulationSession["facilities"];
  clinicalSystem: {
    initialState: SimulationSession["initialClinicalSystemState"];
    activePatientId: string | null;
    records: SimulationSession["records"];
    prescriptions: SimulationSession["prescriptions"];
    openedRecordIds: string[];
    openedPrescriptionIds: string[];
  };
  medicationCatalog: Array<{
    id: string;
    medicationId: string;
    genericName: string;
    strength?: string;
    pharmaceuticalForm: string;
    packageQuantity?: number;
  }>;
  storage: {
    openedDrawerIds: string[];
    drawers: Array<{
      id: string;
      sectorId: string;
      displayedLabel: string;
      physicalCondition: SimulationSession["drawers"][number]["physicalCondition"];
      stockState: SimulationSession["drawers"][number]["stockState"];
      totalQuantity: number;
      contents: Array<{
        id: string;
        presentationId: string;
        quantity: number;
        position: SimulationSession["drawers"][number]["contents"][number]["position"];
      }>;
    }>;
  };
  preparation: {
    requestedItems: SimulationSession["preparation"]["requestedItems"];
    trayItems: ReturnType<typeof deriveRuntimeMaterialState>["trayItems"];
    heldItems: ReturnType<typeof deriveRuntimeMaterialState>["heldItems"];
    workflow: ReturnType<typeof deriveRuntimePreparationWorkflow>;
  };
  handoff: ReturnType<typeof deriveRuntimeHandoffState>;
  capabilities: SimulationIntegrationCapabilities;
};

function runtimeStatus(events: readonly SimulationEvent[]): SimulationRuntimeStatus {
  if (events.some((event) => event.type === "delivery.completed")) return "completed";
  if (events.at(-1)?.type === "delivery.blocked") return "delivery-blocked";
  return "running";
}

export function resolvePlayerActor(session: SimulationSession) {
  const player = session.actors.find(
    (actor) => actor.controller === "player_1" && actor.role === session.playerRole,
  );

  if (!player) {
    throw new Error(
      `Session ${session.id} does not define a player_1 actor for role ${session.playerRole}.`,
    );
  }

  return player;
}

export function deriveSimulationIntegrationSnapshot(
  session: SimulationSession,
  events: readonly SimulationEvent[],
): SimulationIntegrationSnapshot {
  const player = resolvePlayerActor(session);
  const status = runtimeStatus(events);
  const readOnly = status === "completed";
  const state = deriveSimulationState(session, events);
  const material = deriveRuntimeMaterialState(session, events);
  const inventory = deriveRuntimeInventoryState(session, events);
  const workflow = deriveRuntimePreparationWorkflow(events);
  const handoff = deriveRuntimeHandoffState(session, events);
  const heldQuantity = material.heldItems.reduce((total, item) => total + item.quantity, 0);
  const attention = player.role === "attention";
  const preparation = player.role === "preparation";

  return {
    contractVersion: SIMULATION_INTEGRATION_CONTRACT_VERSION,
    session: {
      id: session.id,
      mode: session.mode,
      playerRole: session.playerRole,
      status,
      eventCount: events.length,
      lastEventType: events.at(-1)?.type ?? null,
    },
    player: {
      actorId: player.id,
      role: player.role,
    },
    patients: session.patients.map((patient) => ({
      id: patient.id,
      displayName: `${patient.firstName} ${patient.lastName1} ${patient.lastName2}`,
      syntheticRut: patient.syntheticRut,
      age: patient.age,
    })),
    facilities: session.facilities.map((facility) => ({ ...facility })),
    clinicalSystem: {
      initialState: session.initialClinicalSystemState,
      activePatientId: state.activePatientId,
      records: session.records.map((record) => ({
        ...record,
        prescriptionIds: [...record.prescriptionIds],
      })),
      prescriptions: session.prescriptions.map((prescription) => ({ ...prescription })),
      openedRecordIds: [...state.openedRecordIds],
      openedPrescriptionIds: [...state.openedPrescriptionIds],
    },
    medicationCatalog: session.presentations.map((presentation) => ({
      id: presentation.id,
      medicationId: presentation.medicationId,
      genericName: presentation.genericName,
      strength: presentation.strength,
      pharmaceuticalForm: presentation.pharmaceuticalForm,
      packageQuantity: presentation.packageQuantity,
    })),
    storage: {
      openedDrawerIds: [...state.openedDrawerIds],
      drawers: session.drawers.map((drawer) => {
        const runtimeDrawer = inventory.drawers.find((item) => item.drawerId === drawer.id);
        return {
          id: drawer.id,
          sectorId: drawer.sectorId,
          displayedLabel: drawer.displayedLabel,
          physicalCondition: drawer.physicalCondition,
          stockState: runtimeDrawer?.stockState ?? drawer.stockState,
          totalQuantity:
            runtimeDrawer?.totalQuantity ??
            drawer.contents.reduce((total, item) => total + item.quantity, 0),
          contents: drawer.contents.map((item) => ({
            id: item.id,
            presentationId: item.presentationId,
            quantity:
              runtimeDrawer?.items.find((runtimeItem) => runtimeItem.itemId === item.id)?.quantity ??
              item.quantity,
            position: { ...item.position },
          })),
        };
      }),
    },
    preparation: {
      requestedItems: session.preparation.requestedItems.map((item) => ({ ...item })),
      trayItems: material.trayItems.map((item) => ({ ...item })),
      heldItems: material.heldItems.map((item) => ({ ...item })),
      workflow,
    },
    handoff,
    capabilities: {
      readOnly,
      canUseClinicalSystem: !readOnly && attention,
      canAccessStorage: !readOnly && preparation,
      canModifyTray: !readOnly && preparation && handoff.owner === "preparation",
      canConfirmPreparation:
        !readOnly &&
        preparation &&
        handoff.owner === "preparation" &&
        !workflow.confirmed &&
        !workflow.traySent &&
        heldQuantity === 0,
      canSendTray:
        !readOnly &&
        preparation &&
        handoff.owner === "preparation" &&
        workflow.confirmed &&
        !workflow.traySent &&
        heldQuantity === 0,
      canReceiveTray: !readOnly && attention && handoff.owner === "transit",
      canInspectTray: !readOnly && attention && handoff.owner === "attention",
      canRequestCorrection: !readOnly && attention && handoff.owner === "attention",
      canAttemptDelivery: !readOnly && attention && handoff.owner === "attention",
    },
  };
}

export type SimulationIntegrationDispatchReceipt = {
  acceptedAction: {
    eventId: string;
    type: SimulationEvent["type"];
  };
  generatedEvents: Array<{
    eventId: string;
    type: SimulationEvent["type"];
  }>;
  snapshot: SimulationIntegrationSnapshot;
};
