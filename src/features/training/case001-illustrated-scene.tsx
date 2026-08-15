"use client";

import { sceneHotspots, type SceneHotspotId } from "@/features/training/case001-scene-hotspots";
import { cn } from "@/lib/utils";

type Props = {
  workspace: string;
  documentVisible: boolean;
  trayVisible: boolean;
  preparationState?: "idle" | "preparing" | "delivering" | "delivered";
  guidance?: "guided" | "standard" | "minimal";
  activeHotspot?: SceneHotspotId | null;
  onHotspotClick?: (id: SceneHotspotId) => void;
};

const activeByWorkspace: Record<string, SceneHotspotId[]> = {
  service: ["patient"],
  system: ["computer"],
  preparation: ["preparation"],
  verification: ["patient", "tray"],
  storage: ["storage"],
};

export function Case001IllustratedScene({
  workspace,
  documentVisible,
  trayVisible,
  preparationState = "idle",
  guidance = "guided",
  activeHotspot,
  onHotspotClick,
}: Props) {
  const activeHotspots = activeByWorkspace[workspace] ?? [];

  const visibleHotspots = sceneHotspots.filter((hotspot) => {
    if (hotspot.id === "document") return documentVisible;
    if (hotspot.id === "tray") return trayVisible;
    if (hotspot.id === "preparation") return preparationState !== "idle";
    if (hotspot.id === "reception") return false;
    return true;
  });

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e9e8ec]">
      <img
        alt="Farmacia ambulatoria ficticia para simulación"
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
        draggable={false}
        src="/images/farmasim/case001-scene.jpg"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/5 via-transparent to-white/5" />

      {visibleHotspots.map((hotspot) => {
        const active = activeHotspot === hotspot.id || activeHotspots.includes(hotspot.id);
        const showPermanentLabel = guidance === "guided" && active;

        return (
          <button
            aria-label={`Interactuar con ${hotspot.label}`}
            className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl text-left outline-none transition focus-visible:ring-4 focus-visible:ring-violet-300/60"
            key={hotspot.id}
            onClick={() => onHotspotClick?.(hotspot.id)}
            style={{ left: hotspot.x, top: hotspot.y }}
            type="button"
          >
            <span
              className={cn(
                "mx-auto block size-3.5 rounded-full border-[3px] border-white bg-violet-500/85 shadow-[0_3px_12px_rgba(76,29,149,.35)] transition duration-200 group-hover:scale-125 group-hover:bg-violet-700",
                active && guidance === "guided" && "bg-violet-700 ring-[6px] ring-violet-300/30",
                guidance === "minimal" && "opacity-45 group-hover:opacity-100",
              )}
            />
            <span
              className={cn(
                "pointer-events-none mt-1.5 block whitespace-nowrap rounded-xl border border-violet-100 bg-white/95 px-3 py-1.5 text-[0.65rem] font-extrabold text-slate-700 shadow-[0_5px_18px_rgba(15,23,42,.10)] backdrop-blur-sm transition",
                showPermanentLabel ? "opacity-100" : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100",
              )}
            >
              {hotspot.label}
            </span>
          </button>
        );
      })}

      {documentVisible ? (
        <div className="pointer-events-none absolute bottom-[17%] left-[21%] z-10 w-36 -rotate-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <p className="text-[0.5rem] font-black uppercase tracking-wider text-violet-600">Documento ficticio</p>
          <div className="mt-2 flex gap-2">
            <div className="h-10 w-8 rounded bg-slate-100" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-1.5 rounded bg-slate-300" />
              <div className="h-1.5 w-4/5 rounded bg-slate-200" />
              <div className="h-1.5 w-3/5 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ) : null}

      {preparationState === "preparing" ? (
        <div className="absolute right-[7%] top-[47%] z-10 rounded-full bg-violet-700/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg">Preparando…</div>
      ) : null}
      {preparationState === "delivering" ? (
        <div className="absolute right-[18%] top-[56%] z-10 rounded-full bg-violet-700/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg">Trasladando preparación…</div>
      ) : null}
    </div>
  );
}
