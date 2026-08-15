"use client";

import { sceneHotspots, type SceneHotspotId } from "@/features/training/case001-scene-hotspots";
import { cn } from "@/lib/utils";

type Props = {
  workspace: string;
  documentVisible: boolean;
  trayVisible: boolean;
  activeHotspot?: SceneHotspotId | null;
  onHotspotClick?: (id: SceneHotspotId) => void;
};

const activeByWorkspace: Record<string, SceneHotspotId[]> = {
  service: ["patient", "reception"],
  system: ["computer", "reception"],
  preparation: ["preparation", "tray"],
  verification: ["patient", "tray"],
  storage: ["storage"],
};

export function Case001IllustratedScene({
  workspace,
  documentVisible,
  trayVisible,
  activeHotspot,
  onHotspotClick,
}: Props) {
  const activeHotspots = activeByWorkspace[workspace] ?? [];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e9e8ec]">
      <img
        alt="Farmacia ambulatoria ficticia para simulación"
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
        draggable={false}
        src="/images/farmasim/case001-scene.png"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/5 via-transparent to-white/5" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white/20 to-transparent" />

      {sceneHotspots.map((hotspot) => {
        const active = activeHotspot === hotspot.id || activeHotspots.includes(hotspot.id);
        const dimmedTray = hotspot.id === "tray" && !trayVisible;

        return (
          <button
            aria-label={`Interactuar con ${hotspot.label}`}
            className={cn(
              "group absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl text-left outline-none transition focus-visible:ring-4 focus-visible:ring-violet-300/60",
              dimmedTray && "opacity-75",
            )}
            key={hotspot.id}
            onClick={() => onHotspotClick?.(hotspot.id)}
            style={{ left: hotspot.x, top: hotspot.y }}
            type="button"
          >
            <span
              className={cn(
                "mx-auto block size-4 rounded-full border-[3px] border-white bg-violet-500 shadow-[0_3px_12px_rgba(76,29,149,.35)] transition duration-200 group-hover:scale-110",
                active && "bg-violet-700 ring-[6px] ring-violet-300/35",
              )}
            />
            <span
              className={cn(
                "mt-1.5 block whitespace-nowrap rounded-xl border border-violet-100 bg-white/95 px-3 py-1.5 text-[0.65rem] font-extrabold text-slate-700 shadow-[0_5px_18px_rgba(15,23,42,.10)] backdrop-blur-sm transition group-hover:border-violet-300 group-hover:text-violet-700",
                active && "border-violet-300 text-violet-700",
              )}
            >
              {hotspot.label}
            </span>
          </button>
        );
      })}

      {documentVisible ? (
        <div className="absolute bottom-[18%] left-[16%] z-10 w-40 -rotate-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <p className="text-[0.52rem] font-black uppercase tracking-wider text-violet-600">Documento ficticio</p>
          <div className="mt-2 flex gap-2">
            <div className="h-11 w-9 rounded bg-slate-100" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-1.5 rounded bg-slate-300" />
              <div className="h-1.5 w-4/5 rounded bg-slate-200" />
              <div className="h-1.5 w-3/5 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
