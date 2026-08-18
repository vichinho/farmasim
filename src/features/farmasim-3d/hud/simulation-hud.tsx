"use client";

import type { SimulationIntegrationSnapshot } from "@/features/simulation-engine/presentation";

type Props = {
  snapshot: SimulationIntegrationSnapshot;
  patientName: string;
  source: "generated" | "resumed";
  dirty: boolean;
};

export function SimulationHud({ snapshot, patientName, source, dirty }: Props) {
  const checks = [
    { label: "Sesión del motor abierta", done: true },
    { label: "Paciente dinámico asignado", done: Boolean(snapshot.session.patientId) },
    { label: "Sistema clínico cargado", done: snapshot.clinicalSystem.records.length > 0 },
    { label: "Arsenal disponible", done: snapshot.medicationCatalog.length > 0 },
    { label: "Interacciones 3D conectadas", done: false },
  ];
  const completedChecks = checks.filter((item) => item.done).length;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 text-white">
      <div className="absolute left-4 top-4 rounded-[1.35rem] border border-white/10 bg-[#20172c]/88 px-5 py-4 shadow-2xl backdrop-blur-xl md:left-5 md:top-5">
        <p className="text-xl font-black tracking-tight text-white md:text-2xl">✚ FarmaSim</p>
        <p className="mt-0.5 text-[0.62rem] font-black uppercase tracking-[0.18em] text-violet-200">
          Simulador de farmacia
        </p>
      </div>

      <div className="absolute left-4 top-28 hidden w-64 rounded-2xl border border-white/10 bg-black/65 p-4 shadow-2xl backdrop-blur-lg md:block">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-300">Caso 001</p>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[0.58rem] font-black uppercase tracking-[0.08em] text-emerald-300">
            {source}
          </span>
        </div>
        <p className="mt-2 text-sm font-black leading-5 text-white">{patientName}</p>
        <p className="mt-1 text-xs font-semibold text-white/60">
          Rol: {snapshot.session.playerRole === "attention" ? "Atención" : "Preparación"}
        </p>
        <p className="mt-3 text-[0.68rem] font-semibold leading-5 text-white/55">
          Sesión {snapshot.session.id}
        </p>
      </div>

      <div className="absolute right-4 top-4 w-[min(45vw,23rem)] rounded-xl border border-white/10 bg-black/70 px-4 py-3 shadow-xl backdrop-blur-lg md:right-5 md:top-5">
        <div className="flex items-center justify-between gap-4 text-[0.68rem] font-black uppercase tracking-[0.1em] text-white/80">
          <span>Motor dinámico</span>
          <span className={snapshot.session.status === "completed" ? "text-emerald-300" : "text-violet-200"}>
            {snapshot.session.status}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[0.65rem] font-semibold text-white/55">
          <span>{snapshot.session.eventCount} eventos</span>
          <span>{dirty ? "Cambios sin guardar" : "Sin cambios pendientes"}</span>
        </div>
      </div>

      <div className="absolute right-5 top-32 hidden w-[18rem] rounded-2xl border border-white/10 bg-[#17131f]/90 p-5 shadow-2xl backdrop-blur-xl lg:block">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-300">Vertical slice</p>
          <span className="text-xs font-black text-white/55">{completedChecks} / {checks.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {checks.map((task, index) => (
            <div className="flex items-start gap-3" key={task.label}>
              <span
                className={
                  task.done
                    ? "grid size-5 shrink-0 place-items-center rounded-full bg-emerald-400 text-[0.68rem] font-black text-emerald-950"
                    : "mt-0.5 size-4 shrink-0 rounded-full border border-white/55"
                }
              >
                {task.done ? "✓" : ""}
              </span>
              <span className={task.done ? "text-sm font-bold text-white" : "text-sm font-semibold leading-5 text-white/60"}>
                {index + 1}. {task.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative size-5 opacity-90">
          <span className="absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-white" />
          <span className="absolute bottom-0 left-1/2 h-1.5 w-px -translate-x-1/2 bg-white" />
          <span className="absolute left-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-white" />
          <span className="absolute right-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-white" />
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 rounded-xl border border-violet-300/30 bg-[#24192f]/92 px-5 py-3 text-sm font-black shadow-2xl backdrop-blur-lg md:block">
        Motor conectado · interacción física en el siguiente bloque
      </div>

      <div className="absolute bottom-5 right-5 hidden rounded-xl border border-white/10 bg-black/65 px-4 py-3 text-xs font-bold leading-6 text-white/80 shadow-xl backdrop-blur-lg md:block">
        <p><span className="mr-2 rounded border border-white/30 px-1.5 py-0.5">W A S D</span> Mover</p>
        <p><span className="mr-2 rounded border border-white/30 px-1.5 py-0.5">Mouse</span> Mirar</p>
        <p><span className="mr-2 rounded border border-white/30 px-1.5 py-0.5">E</span> Próximo: interactuar</p>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.16em] text-white/55 md:hidden">
        Engine conectado · {snapshot.session.eventCount} eventos
      </div>
    </div>
  );
}
