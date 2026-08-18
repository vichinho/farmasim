import type {
  PreparationItem,
  SimulationEvent,
  SimulationSession,
} from "@/features/simulation-engine/types";

export type RuntimeMaterialState = {
  trayItems: PreparationItem[];
  heldItems: PreparationItem[];
};

function quantityFromEvent(event: SimulationEvent): number {
  const value = event.metadata?.quantity;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 1;
}

export function resolveMedicationPresentationId(
  session: SimulationSession,
  targetId: string | undefined,
): string | null {
  if (!targetId) return null;

  if (session.presentations.some((presentation) => presentation.id === targetId)) {
    return targetId;
  }

  for (const drawer of session.drawers) {
    const item = drawer.contents.find((content) => content.id === targetId);
    if (item) return item.presentationId;
  }

  return null;
}

function addQuantity(map: Map<string, number>, presentationId: string, quantity: number) {
  map.set(presentationId, (map.get(presentationId) ?? 0) + quantity);
}

function removeQuantity(
  map: Map<string, number>,
  presentationId: string,
  quantity: number,
): number {
  const available = map.get(presentationId) ?? 0;
  const removed = Math.min(available, quantity);
  const remaining = available - removed;

  if (remaining > 0) map.set(presentationId, remaining);
  else map.delete(presentationId);

  return removed;
}

function toItems(map: Map<string, number>): PreparationItem[] {
  return [...map.entries()]
    .filter(([, quantity]) => quantity > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([presentationId, quantity]) => ({ presentationId, quantity }));
}

/**
 * Attention-role sessions start with the preparation delivered by the
 * simulated preparation actor. Preparation-role sessions start with an empty
 * tray because the player is responsible for building it from storage.
 */
function initialTray(session: SimulationSession): Map<string, number> {
  const map = new Map<string, number>();
  if (session.playerRole === "preparation") return map;

  for (const item of session.preparation.preparedItems) {
    addQuantity(map, item.presentationId, item.quantity);
  }
  return map;
}

export function deriveRuntimeMaterialState(
  session: SimulationSession,
  events: readonly SimulationEvent[],
): RuntimeMaterialState {
  const tray = initialTray(session);
  const held = new Map<string, number>();

  for (const event of events) {
    if (
      event.type !== "medication.taken" &&
      event.type !== "medication.added_to_tray" &&
      event.type !== "medication.returned"
    ) {
      continue;
    }

    const presentationId = resolveMedicationPresentationId(session, event.targetId);
    if (!presentationId) continue;
    const quantity = quantityFromEvent(event);

    if (event.type === "medication.taken") {
      addQuantity(held, presentationId, quantity);
      continue;
    }

    if (event.type === "medication.added_to_tray") {
      removeQuantity(held, presentationId, quantity);
      addQuantity(tray, presentationId, quantity);
      continue;
    }

    let remaining = quantity;
    remaining -= removeQuantity(held, presentationId, remaining);
    if (remaining > 0) removeQuantity(tray, presentationId, remaining);
  }

  return {
    trayItems: toItems(tray),
    heldItems: toItems(held),
  };
}

export function runtimeEffectiveSession(
  session: SimulationSession,
  material: RuntimeMaterialState,
): SimulationSession {
  return {
    ...session,
    preparation: {
      ...session.preparation,
      preparedItems: material.trayItems.map((item) => ({ ...item })),
    },
  };
}
