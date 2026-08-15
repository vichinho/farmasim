"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type {
  DispensingCriterionId,
  PharmacyArea,
  TrainingCase,
  TrainingMode,
  TrainingStage,
} from "@/types/training-simulation";

const criterionGroups: {
  title: string;
  ids: DispensingCriterionId[];
}[] = [
  {
    title: "Identificación",
    ids: [
      "criterion-1-request-identity-document",
      "criterion-2-system-identity-match",
    ],
  },
  {
    title: "Validación operativa",
    ids: [
      "criterion-3-identify-all-prescriptions",
      "criterion-4-confirm-prescription-issued",
    ],
  },
  {
    title: "Preparación",
    ids: ["criterion-5-compare-prepared-items"],
  },
  {
    title: "Despacho",
    ids: [
      "criterion-6-recheck-identity-before-handoff",
      "criterion-7-provide-corresponding-instructions",
    ],
  },
];

const criterionLabels: Record<DispensingCriterionId, string> = {
  "criterion-1-request-identity-document": "Solicita carnet de identidad y/o crónico",
  "criterion-2-system-identity-match": "Digita RUT y verifica nombre de usuario",
  "criterion-3-identify-all-prescriptions": "Identifica todas las prescripciones disponibles",
  "criterion-4-confirm-prescription-issued": "Verifica que la receta esté emitida",
  "criterion-5-compare-prepared-items": "Medicamentos preparados corresponden a la receta",
  "criterion-6-recheck-identity-before-handoff": "Vuelve a verificar la identidad del usuario",
  "criterion-7-provide-corresponding-instructions": "Entrega las indicaciones correspondientes",
};

const actionDockItems: { area: PharmacyArea; label: string; icon: string }[] = [
  { area: "service-counter", label: "Solicitar documento", icon: "▣" },
  { area: "clinical-terminal", label: "Ir al computador", icon: "▤" },
  { area: "clinical-terminal", label: "Abrir prescripciones", icon: "▱" },
  { area: "preparation-counter", label: "Revisar bandeja", icon: "▥" },
  { area: "dispatch-counter", label: "Verificar identidad final", icon: "◈" },
  { area: "dispatch-counter", label: "Entregar indicaciones", icon: "◌" },
];

type SimulationExperienceShellProps = {
  elapsedSeconds: number;
  levelNumber: number;
  mode: TrainingMode;
  panel: ReactNode;
  progress: number;
  stage: TrainingStage;
  statusLabel: string;
  trainingCase: TrainingCase;
  visitedStageIds: string[];
};

export function SimulationExperienceShell({
  elapsedSeconds,
  levelNumber,
  mode,
  panel,
  progress,
  stage,
  statusLabel,
  trainingCase,
  visitedStageIds,
}: SimulationExperienceShellProps) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-violet-100 bg-[#f8f7fc] shadow-[0_26px_80px_rgba(63,37,122,0.14)]">
      <SimulationHeader
        elapsedSeconds={elapsedSeconds}
        levelNumber={levelNumber}
        mode={mode}
        progress={progress}
        statusLabel={statusLabel}
        title={trainingCase.title}
      />

      <div className="grid min-h-[680px] xl:grid-cols-[minmax(0,1fr)_30rem]">
        <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
          <div className="relative min-h-[570px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50">
            <PharmacyIllustration activeArea={stage.area} stage={stage} />

            <div className="absolute inset-x-4 bottom-4 z-30 sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-[min(92%,44rem)] sm:-translate-x-1/2">
              <div className="max-h-[440px] overflow-auto rounded-[1.5rem] border border-violet-100 bg-white/96 p-1 shadow-[0_22px_65px_rgba(37,24,74,0.22)] backdrop-blur">
                {panel}
              </div>
            </div>
          </div>

          <ActionDock activeArea={stage.area} stage={stage} />
        </div>

        <aside className="space-y-4 bg-white p-4 sm:p-5">
          <ObjectivesCard stage={stage} trainingCase={trainingCase} />
          <CriteriaCard
            currentStageId={stage.id}
            trainingCase={trainingCase}
            visitedStageIds={visitedStageIds}
          />
          <ReminderCard />
        </aside>
      </div>

      <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">
        Simulación interactiva — no reemplaza protocolos institucionales.
      </footer>
    </section>
  );
}

function SimulationHeader({
  elapsedSeconds,
  levelNumber,
  mode,
  progress,
  statusLabel,
  title,
}: {
  elapsedSeconds: number;
  levelNumber: number;
  mode: TrainingMode;
  progress: number;
  statusLabel: string;
  title: string;
}) {
  return (
    <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(18rem,32rem)_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white shadow-lg shadow-violet-200">+</div>
        <div className="min-w-0">
          <p className="font-black tracking-tight text-violet-800">FarmaSim</p>
          <p className="truncate text-xs font-semibold text-slate-500">Simulaciones · {title}</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
          <span>{statusLabel}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-violet-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="h-full rounded-full bg-violet-600 transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <div className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ Nivel {levelNumber}</div>
        <div className="min-w-[6rem] rounded-xl border border-slate-200 px-3 py-2 text-right">
          <p className="text-sm font-black tabular-nums text-slate-900">{formatClock(elapsedSeconds)}</p>
          <p className="text-[0.62rem] font-bold uppercase tracking-wide text-slate-400">{mode.pressureTargetSeconds ? "Tiempo" : "Transcurrido"}</p>
        </div>
      </div>
    </header>
  );
}

function PharmacyIllustration({ activeArea, stage }: { activeArea: PharmacyArea; stage: TrainingStage }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-0 bottom-0 h-[43%] bg-[linear-gradient(135deg,#eef0f6_25%,transparent_25%),linear-gradient(225deg,#eef0f6_25%,transparent_25%),linear-gradient(45deg,#eef0f6_25%,transparent_25%),linear-gradient(315deg,#eef0f6_25%,#f8fafc_25%)] bg-[length:38px_38px]" />
      <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#f4f0fb] to-[#eef3f8]" />

      <div className="absolute left-[4%] top-[10%] hidden h-40 w-28 rounded-xl border-4 border-violet-200 bg-violet-100/80 p-3 text-center text-[0.65rem] font-black text-violet-700 md:block">
        <div className="text-3xl">+</div>
        <div className="mt-2">SEGURIDAD DEL PACIENTE</div>
        <div className="mt-3 text-left font-semibold text-violet-600">✓ Verifica<br />✓ Confirma<br />✓ Comunica</div>
      </div>

      <StorageCabinet active={activeArea === "storage"} />
      <Counter />
      <Computer active={activeArea === "clinical-terminal"} />
      <PersonActor className="left-[8%] top-[39%]" label="Paciente" tone="patient" active={activeArea === "service-counter"} />
      <PersonActor className="left-[42%] top-[27%]" label="TENS 1 · Recepción" tone="staff" active={activeArea === "service-counter" || activeArea === "clinical-terminal"} />
      <PersonActor className="left-[71%] top-[31%]" label="TENS 2 · Bandeja" tone="staff" active={activeArea === "preparation-counter"} tray />

      <Hotspot className="left-[15%] top-[65%]" label="Documento sobre el mesón" active={activeArea === "service-counter"} />
      <Hotspot className="left-[36%] top-[56%]" label="Computador" active={activeArea === "clinical-terminal"} />
      <Hotspot className="left-[62%] top-[18%]" label="Gavetas / almacenamiento" active={activeArea === "storage"} />
      <Hotspot className="left-[76%] top-[65%]" label="Mesón de preparación" active={activeArea === "preparation-counter" || activeArea === "dispatch-counter"} />

      <div className="absolute right-4 top-4 max-w-xs rounded-2xl border border-white/80 bg-white/88 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-violet-600">Paso actual</p>
        <p className="mt-1 text-sm font-black text-slate-900">{stage.title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{stage.content}</p>
      </div>
    </div>
  );
}

function Counter() {
  return (
    <>
      <div className="absolute left-[5%] top-[58%] h-[17%] w-[55%] skew-x-[-7deg] rounded-xl border border-slate-300 bg-gradient-to-b from-white to-slate-200 shadow-xl" />
      <div className="absolute left-[53%] top-[61%] h-[19%] w-[38%] skew-x-[-7deg] rounded-xl border border-slate-300 bg-gradient-to-b from-slate-50 to-slate-300 shadow-xl" />
    </>
  );
}

function StorageCabinet({ active }: { active: boolean }) {
  return (
    <div className={cn("absolute left-[57%] top-[10%] grid h-[32%] w-[34%] grid-cols-4 gap-1 rounded-xl border-4 bg-slate-500/80 p-2 shadow-lg transition", active ? "border-violet-500 ring-4 ring-violet-300/50" : "border-slate-400")}>
      {Array.from({ length: 20 }).map((_, index) => (
        <div className={cn("rounded-sm border border-white/60", index % 5 === 0 ? "bg-violet-200" : index % 3 === 0 ? "bg-emerald-100" : "bg-white")} key={index} />
      ))}
    </div>
  );
}

function Computer({ active }: { active: boolean }) {
  return (
    <div className={cn("absolute left-[32%] top-[46%] z-10 transition", active && "scale-105")}> 
      <div className={cn("h-20 w-28 rounded-lg border-4 bg-slate-900 shadow-lg", active ? "border-violet-500 ring-4 ring-violet-300/50" : "border-slate-700")}>
        <div className="m-2 h-10 rounded bg-gradient-to-br from-violet-100 to-sky-100" />
      </div>
      <div className="mx-auto h-6 w-3 bg-slate-600" />
      <div className="mx-auto h-2 w-14 rounded-full bg-slate-700" />
    </div>
  );
}

function PersonActor({
  active,
  className,
  label,
  tone,
  tray = false,
}: {
  active: boolean;
  className: string;
  label: string;
  tone: "patient" | "staff";
  tray?: boolean;
}) {
  return (
    <div className={cn("absolute z-20 w-28 -translate-x-1/2 text-center transition", className, active && "scale-105")}> 
      <div className={cn("mx-auto size-14 rounded-full border-4 shadow", tone === "staff" ? "border-violet-300 bg-amber-100" : "border-emerald-200 bg-amber-100", active && "ring-4 ring-violet-300/50")} />
      <div className={cn("mx-auto -mt-1 h-24 w-20 rounded-[2rem_2rem_1rem_1rem] border-4 shadow-md", tone === "staff" ? "border-violet-300 bg-violet-500" : "border-emerald-200 bg-emerald-500")} />
      {tray ? <div className="absolute left-1/2 top-24 h-5 w-28 -translate-x-1/2 rounded-md border-2 border-violet-300 bg-violet-100 shadow"><span className="absolute left-3 -top-3 size-4 rounded bg-white" /><span className="absolute left-9 -top-4 size-5 rounded bg-amber-100" /><span className="absolute right-3 -top-3 size-4 rounded bg-white" /></div> : null}
      <div className="mx-auto mt-2 inline-flex rounded-full border border-violet-200 bg-white/95 px-3 py-1 text-[0.68rem] font-black text-violet-700 shadow">{label}</div>
    </div>
  );
}

function Hotspot({ active, className, label }: { active: boolean; className: string; label: string }) {
  return (
    <div className={cn("absolute z-20 -translate-x-1/2", className)}>
      <div className={cn("mx-auto size-4 rounded-full border-4 border-white shadow transition", active ? "animate-pulse bg-violet-600 ring-4 ring-violet-300/60" : "bg-violet-400")} />
      <div className={cn("mt-1 whitespace-nowrap rounded-xl border bg-white/95 px-3 py-1.5 text-[0.65rem] font-black shadow", active ? "border-violet-300 text-violet-700" : "border-slate-200 text-slate-500")}>{label}</div>
    </div>
  );
}

function ActionDock({ activeArea, stage }: { activeArea: PharmacyArea; stage: TrainingStage }) {
  return (
    <div className="grid grid-cols-2 gap-2 border-t border-violet-100 bg-white p-3 sm:grid-cols-3 lg:grid-cols-6">
      {actionDockItems.map((item, index) => {
        const active = item.area === activeArea || (activeArea === "storage" && index === 3);
        return (
          <div className={cn("flex min-h-20 items-center gap-3 rounded-2xl border px-3 py-3 transition", active ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-200" : "border-violet-100 bg-white text-violet-700")} key={`${item.label}-${index}`}>
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-lg font-black", active ? "bg-white/15" : "bg-violet-50")}>{item.icon}</span>
            <span className="text-xs font-black leading-4">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ObjectivesCard({ stage, trainingCase }: { stage: TrainingStage; trainingCase: TrainingCase }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">◎</div>
        <h3 className="font-black text-slate-900">Objetivos del caso</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-5 text-slate-700">
        <li>• Completar el proceso sin omitir verificaciones observables.</li>
        <li>• Contrastar identidad y prescripciones ficticias.</li>
        <li>• Revisar medicamento, concentración, forma farmacéutica y cantidad.</li>
        <li>• Reconocer cuándo una situación requiere apoyo del QF.</li>
      </ul>
      <div className="mt-4 rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">Ahora: {stage.title}</div>
      <p className="mt-2 text-[0.65rem] leading-4 text-slate-400">{trainingCase.context.location}</p>
    </div>
  );
}

function CriteriaCard({
  currentStageId,
  trainingCase,
  visitedStageIds,
}: {
  currentStageId: string;
  trainingCase: TrainingCase;
  visitedStageIds: string[];
}) {
  const criterionStages = new Map<DispensingCriterionId, string[]>();
  trainingCase.stages.forEach((stage) => {
    stage.criterionIds?.forEach((criterionId) => {
      criterionStages.set(criterionId, [...(criterionStages.get(criterionId) ?? []), stage.id]);
    });
  });

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">▤</div>
        <div>
          <h3 className="font-black text-slate-900">Criterios evaluados</h3>
          <p className="text-[0.65rem] text-slate-400">Seguimiento interno del caso</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {criterionGroups.map((group) => (
          <section className="overflow-hidden rounded-xl border border-violet-100" key={group.title}>
            <div className="flex items-center justify-between bg-violet-50 px-3 py-2">
              <p className="text-xs font-black text-violet-700">{group.title}</p>
              <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-violet-600">{group.ids.length}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {group.ids.map((criterionId) => {
                const relatedStages = criterionStages.get(criterionId) ?? [];
                const isCurrent = relatedStages.includes(currentStageId);
                const wasVisited = relatedStages.some((stageId) => visitedStageIds.includes(stageId));
                const status = isCurrent ? "En progreso" : wasVisited ? "Registrado" : "No evaluado";
                return (
                  <div className="flex items-start justify-between gap-3 px-3 py-2.5" key={criterionId}>
                    <p className="text-[0.7rem] font-semibold leading-4 text-slate-700">{criterionLabels[criterionId]}</p>
                    <span className={cn("shrink-0 rounded-md px-2 py-1 text-[0.58rem] font-black", isCurrent ? "bg-blue-50 text-blue-700" : wasVisited ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{status}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ReminderCard() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔔</div>
        <div>
          <p className="font-black text-slate-900">NO OLVIDAR</p>
          <p className="mt-1 text-sm leading-5 text-slate-700">Verifica medicamento, concentración, forma farmacéutica y cantidad antes del despacho.</p>
        </div>
      </div>
    </div>
  );
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}
