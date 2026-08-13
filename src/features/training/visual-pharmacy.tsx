"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROFESSIONAL_REVIEW_MARKER,
  type PharmacyArea,
  type TrainingCase,
} from "@/types/training-simulation";

type SceneArea = Exclude<PharmacyArea, "entrance" | "dispatch-counter">;

type AreaDefinition = {
  description: string;
  eyebrow: string;
  id: SceneArea;
  instruction: string;
  label: string;
};

const areas: AreaDefinition[] = [
  {
    id: "service-counter",
    eyebrow: "Punto de inicio",
    label: "Mesón de atención",
    description: "Aquí comienza la conversación con el paciente virtual.",
    instruction: "Explora el entorno antes de iniciar las decisiones del caso.",
  },
  {
    id: "clinical-terminal",
    eyebrow: "Área 2",
    label: "Computador",
    description: "Terminal ficticio para revisar la información demostrativa del caso.",
    instruction: "La interacción clínica completa se habilitará en la siguiente fase.",
  },
  {
    id: "storage",
    eyebrow: "Área 3",
    label: "Almacenamiento",
    description: "Estanterías y gavetas visuales para practicar búsqueda y selección.",
    instruction: "Observa la distribución general sin aplicar reglas farmacéuticas reales.",
  },
  {
    id: "preparation-counter",
    eyebrow: "Área 4",
    label: "Mesón de preparación",
    description: "Zona destinada a las verificaciones visuales dentro de la simulación.",
    instruction: "En fases posteriores aparecerán barreras y feedback diferido.",
  },
];

type VisualPharmacyProps = {
  context: TrainingCase["context"];
  professionalReviewMarker?: string;
};

export function VisualPharmacy({ context, professionalReviewMarker }: VisualPharmacyProps) {
  const [activeAreaId, setActiveAreaId] = useState<SceneArea>("service-counter");
  const [visitedAreaIds, setVisitedAreaIds] = useState<SceneArea[]>(["service-counter"]);
  const activeArea = areas.find((area) => area.id === activeAreaId) ?? areas[0];

  function visitArea(areaId: SceneArea) {
    setActiveAreaId(areaId);
    setVisitedAreaIds((current) => (current.includes(areaId) ? current : [...current, areaId]));
  }

  return (
    <section aria-labelledby="pharmacy-heading" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <ContextItem label="Hora simulada" value={context.timeLabel} />
        <ContextItem label="Lugar" value={context.location} />
        <ContextItem label="Paciente" value={context.patientDescription} />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-white shadow-[0_18px_50px_rgb(19_33_60/0.10)]">
        <div className="flex flex-col gap-3 border-b border-emerald-100 bg-emerald-950 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-emerald-300">FARMACIA VIRTUAL</p>
            <h2 className="mt-1 text-xl font-bold" id="pharmacy-heading">
              Explora las áreas del caso
            </h2>
          </div>
          <p className="text-sm text-emerald-100" aria-live="polite">
            {visitedAreaIds.length} de {areas.length} áreas exploradas
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.75fr)]">
          <div className="bg-emerald-50/60 p-3 sm:p-5">
            <div
              aria-label="Plano interactivo de una farmacia ficticia"
              className="relative min-h-[34rem] overflow-hidden rounded-3xl border-4 border-white bg-[#dfe9df] shadow-inner sm:min-h-[38rem]"
              role="group"
            >
              <div aria-hidden="true" className="absolute inset-0 pharmacy-floor-grid" />
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-14 bg-emerald-900 shadow-md">
                <div className="mx-auto mt-3 w-fit rounded-lg border border-emerald-500/50 bg-emerald-800 px-4 py-1.5 text-xs font-black tracking-[0.18em] text-white">
                  FARMA SIM
                </div>
              </div>

              <SceneHotspot
                active={activeAreaId === "storage"}
                className="left-[4%] top-[16%] h-[35%] w-[39%]"
                label="Almacenamiento"
                onClick={() => visitArea("storage")}
              >
                <StorageIllustration />
              </SceneHotspot>

              <SceneHotspot
                active={activeAreaId === "clinical-terminal"}
                className="right-[5%] top-[15%] h-[31%] w-[42%]"
                label="Computador"
                onClick={() => visitArea("clinical-terminal")}
              >
                <TerminalIllustration />
              </SceneHotspot>

              <SceneHotspot
                active={activeAreaId === "preparation-counter"}
                className="left-[5%] bottom-[8%] h-[31%] w-[42%]"
                label="Mesón de preparación"
                onClick={() => visitArea("preparation-counter")}
              >
                <PreparationIllustration />
              </SceneHotspot>

              <SceneHotspot
                active={activeAreaId === "service-counter"}
                className="right-[4%] bottom-[7%] h-[39%] w-[45%]"
                label="Mesón de atención"
                onClick={() => visitArea("service-counter")}
              >
                <ServiceIllustration />
              </SceneHotspot>

              <div aria-hidden="true" className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-t-xl bg-white/80 px-4 py-1 text-[0.65rem] font-bold tracking-[0.14em] text-slate-500">
                ENTRADA
              </div>
            </div>
          </div>

          <aside className="flex flex-col border-t border-[var(--border)] p-5 lg:border-l lg:border-t-0 lg:p-6">
            <Badge className="self-start" tone="brand">
              {activeArea.eyebrow}
            </Badge>
            <h3 className="mt-4 text-2xl font-bold">{activeArea.label}</h3>
            <p className="mt-3 text-base leading-7 text-[var(--muted)]">{activeArea.description}</p>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">Objetivo de exploración</p>
              <p className="mt-1 text-sm leading-6 text-amber-900/80">{activeArea.instruction}</p>
            </div>

            <nav aria-label="Áreas de la farmacia" className="mt-6">
              <p className="text-xs font-bold tracking-[0.14em] text-[var(--muted)]">IR A UN ÁREA</p>
              <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
                {areas.map((area, index) => {
                  const isActive = area.id === activeAreaId;
                  const isVisited = visitedAreaIds.includes(area.id);

                  return (
                    <button
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-xl border px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]",
                        isActive
                          ? "border-emerald-600 bg-emerald-50 text-[var(--brand-strong)]"
                          : "border-[var(--border)] bg-white hover:bg-slate-50",
                      )}
                      key={area.id}
                      onClick={() => visitArea(area.id)}
                      type="button"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-lg text-xs",
                          isVisited ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {isVisited ? "✓" : index + 1}
                      </span>
                      {area.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            <p className="mt-auto pt-6 text-xs leading-5 text-[var(--muted)]">
              {professionalReviewMarker ?? PROFESSIONAL_REVIEW_MARKER} Este prototipo no reemplaza
              protocolos ni supervisión profesional.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-bold tracking-[0.1em] text-[var(--muted)]">{label.toUpperCase()}</p>
      <p className="mt-1 text-sm font-semibold leading-5">{value}</p>
    </div>
  );
}

type SceneHotspotProps = {
  active: boolean;
  children: React.ReactNode;
  className: string;
  label: string;
  onClick: () => void;
};

function SceneHotspot({ active, children, className, label, onClick }: SceneHotspotProps) {
  return (
    <button
      aria-label={`Explorar ${label}`}
      className={cn(
        "group absolute rounded-2xl border-2 bg-white/65 p-2 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:p-3",
        active
          ? "border-emerald-600 bg-white ring-4 ring-emerald-300/60"
          : "border-white/90 hover:border-emerald-300",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {children}
      <span
        className={cn(
          "absolute bottom-2 left-2 rounded-lg px-2 py-1 text-[0.65rem] font-black tracking-wide shadow-sm sm:text-xs",
          active ? "bg-emerald-700 text-white" : "bg-white text-slate-700",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function StorageIllustration() {
  return (
    <div aria-hidden="true" className="grid h-full grid-cols-3 gap-1 rounded-xl bg-emerald-900 p-2 pb-9 sm:gap-2 sm:p-3 sm:pb-10">
      {Array.from({ length: 9 }, (_, index) => (
        <div className="relative rounded bg-emerald-50 shadow-inner" key={index}>
          <div className={cn("absolute inset-x-1 bottom-2 h-2 rounded-sm", index % 3 === 0 ? "bg-amber-300" : index % 3 === 1 ? "bg-sky-300" : "bg-rose-300")} />
          <div className="absolute inset-x-2 top-2 h-1 rounded bg-emerald-200" />
        </div>
      ))}
    </div>
  );
}

function TerminalIllustration() {
  return (
    <div aria-hidden="true" className="relative h-full overflow-hidden rounded-xl bg-slate-200 pb-8">
      <div className="absolute inset-x-[13%] top-[10%] h-[56%] rounded-lg border-4 border-slate-700 bg-sky-50 p-2 shadow-lg">
        <div className="h-2 w-2/3 rounded bg-emerald-500" />
        <div className="mt-2 h-1.5 w-full rounded bg-slate-200" />
        <div className="mt-1.5 h-1.5 w-4/5 rounded bg-slate-200" />
        <div className="mt-2 grid grid-cols-3 gap-1">
          <div className="h-5 rounded bg-amber-200" />
          <div className="h-5 rounded bg-emerald-200" />
          <div className="h-5 rounded bg-sky-200" />
        </div>
      </div>
      <div className="absolute bottom-[22%] left-1/2 h-6 w-2 -translate-x-1/2 bg-slate-600" />
      <div className="absolute bottom-[18%] left-1/2 h-2 w-16 -translate-x-1/2 rounded bg-slate-600" />
      <div className="absolute inset-x-[8%] bottom-8 h-3 rounded bg-slate-500" />
    </div>
  );
}

function PreparationIllustration() {
  return (
    <div aria-hidden="true" className="relative h-full rounded-xl bg-slate-100 pb-8">
      <div className="absolute inset-x-[5%] top-[16%] h-[45%] rounded-lg border-t-8 border-amber-700 bg-amber-100 shadow-md">
        <div className="absolute left-[12%] top-3 h-8 w-12 rounded border border-sky-300 bg-white" />
        <div className="absolute right-[12%] top-3 grid grid-cols-2 gap-1">
          <div className="h-8 w-5 rounded-sm bg-emerald-300" />
          <div className="h-8 w-5 rounded-sm bg-sky-300" />
        </div>
      </div>
      <div className="absolute bottom-[22%] left-[17%] h-[27%] w-3 bg-amber-800" />
      <div className="absolute bottom-[22%] right-[17%] h-[27%] w-3 bg-amber-800" />
    </div>
  );
}

function ServiceIllustration() {
  return (
    <div aria-hidden="true" className="relative h-full overflow-hidden rounded-xl bg-emerald-50 pb-8">
      <Person className="left-[8%] top-[7%]" coat="bg-amber-400" skin="bg-amber-200" />
      <Person className="right-[10%] top-[5%]" coat="bg-emerald-600" skin="bg-orange-200" />
      <div className="absolute inset-x-[5%] bottom-[23%] h-[33%] rounded-lg border-t-8 border-emerald-800 bg-emerald-700 shadow-lg">
        <div className="mx-auto mt-3 h-2 w-1/3 rounded bg-emerald-300" />
      </div>
    </div>
  );
}

function Person({ className, coat, skin }: { className: string; coat: string; skin: string }) {
  return (
    <div className={cn("absolute z-10 h-24 w-14", className)}>
      <div className={cn("mx-auto size-8 rounded-full border-2 border-white shadow", skin)} />
      <div className={cn("mx-auto mt-1 h-14 w-12 rounded-t-full", coat)} />
    </div>
  );
}
