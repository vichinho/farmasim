import type {
  DrawerStockState,
  SimulationEvent,
  SimulationSession,
} from "@/features/simulation-engine/types";

export type RuntimeInventoryItemState = {
  itemId: string;
  presentationId: string;
  initialQuantity: number;
  quantity: number;
};

export type RuntimeDrawerInventoryState = {
  drawerId: string;
  initialTotal: number;
  totalQuantity: number;
  lowStockThreshold: number;
  stockState: DrawerStockState;
  items: RuntimeInventoryItemState[];
};

export type RuntimeInventoryState = {
  drawers: RuntimeDrawerInventoryState[];
};

export type MedicationStockSource = {
  drawerId: string;
  itemId: string;
  presentationId: string;
};

function quantityFromEvent(event: SimulationEvent): number {
  const value = event.metadata?.quantity;
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 1;
}

function stockState(totalQuantity: number, lowStockThreshold: number): DrawerStockState {
  if (totalQuantity <= 0) return "out-of-stock";
  if (totalQuantity <= lowStockThreshold) return "low";
  return "available";
}

export function resolveMedicationStockSource(
  session: SimulationSession,
  targetId: string | undefined,
  metadata?: Record<string, unknown>,
): MedicationStockSource | null {
  if (!targetId) return null;

  for (const drawer of session.drawers) {
    const directItem = drawer.contents.find((item) => item.id === targetId);
    if (directItem) {
      return {
        drawerId: drawer.id,
        itemId: directItem.id,
        presentationId: directItem.presentationId,
      };
    }
  }

  const metadataDrawerId =
    typeof metadata?.drawerId === "string" ? metadata.drawerId : undefined;
  const metadataDrawerItemId =
    typeof metadata?.drawerItemId === "string" ? metadata.drawerItemId : undefined;

  if (metadataDrawerItemId) {
    for (const drawer of session.drawers) {
      const item = drawer.contents.find((content) => content.id === metadataDrawerItemId);
      if (!item) continue;
      return {
        drawerId: drawer.id,
        itemId: item.id,
        presentationId: item.presentationId,
      };
    }
  }

  if (metadataDrawerId) {
    const drawer = session.drawers.find((item) => item.id === metadataDrawerId);
    const item = drawer?.contents.find((content) => content.presentationId === targetId);
    if (drawer && item) {
      return {
        drawerId: drawer.id,
        itemId: item.id,
        presentationId: item.presentationId,
      };
    }
  }

  const candidates = session.drawers.flatMap((drawer) =>
    drawer.contents
      .filter((item) => item.presentationId === targetId)
      .map((item) => ({
        drawerId: drawer.id,
        itemId: item.id,
        presentationId: item.presentationId,
      })),
  );

  return candidates.length === 1 ? candidates[0] ?? null : null;
}

export function deriveRuntimeInventoryState(
  session: SimulationSession,
  events: readonly SimulationEvent[],
): RuntimeInventoryState {
  const quantities = new Map<string, number>();

  for (const drawer of session.drawers) {
    for (const item of drawer.contents) quantities.set(item.id, item.quantity);
  }

  for (const event of events) {
    if (event.type !== "medication.taken" && event.type !== "medication.returned") {
      continue;
    }

    const source = resolveMedicationStockSource(session, event.targetId, event.metadata);
    if (!source) continue;

    const quantity = quantityFromEvent(event);
    const current = quantities.get(source.itemId) ?? 0;

    if (event.type === "medication.taken") {
      quantities.set(source.itemId, Math.max(0, current - quantity));
    } else {
      quantities.set(source.itemId, current + quantity);
    }
  }

  return {
    drawers: session.drawers.map((drawer) => {
      const items = drawer.contents.map((item) => ({
        itemId: item.id,
        presentationId: item.presentationId,
        initialQuantity: item.quantity,
        quantity: quantities.get(item.id) ?? 0,
      }));
      const initialTotal = drawer.contents.reduce((total, item) => total + item.quantity, 0);
      const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
      const lowStockThreshold = Math.max(1, Math.ceil(initialTotal * 0.2));

      return {
        drawerId: drawer.id,
        initialTotal,
        totalQuantity,
        lowStockThreshold,
        stockState: stockState(totalQuantity, lowStockThreshold),
        items,
      };
    }),
  };
}
