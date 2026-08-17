"use client";

const tasks = [
  { label: "Atender al paciente", done: true },
  { label: "Revisar receta médica", done: false },
  { label: "Buscar medicamentos", done: false },
  { label: "Verificar dosis y forma", done: false },
  { label: "Entregar e informar", done: false },
];

export function SimulationHud() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 text-white">
      <div className="absolute left-4 top-4 rounded-[1.35rem] border border-white/10 bg-[#20172c]/88 px-5 py-4 shadow-2xl backdrop-blur-xl md:left-5 md:top-5">
        <p className="text-xl font-black tracking-tight text-white md:text-2xl">✚ FarmaSim</p>
        <p className="mt-0.5 text-[0.62rem] font-black uppercase tracking-[0.18em] text-violet-200">Simulador de farmacia</p>
      </div>

      <div className="absolute left-4 top-28 hidden w-52 rounded-2xl border border-white/10 bg-black/65 p-4 shadow-2xl backdrop-blur-lg md:block">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-300">Módulo 1</p>
        <p className="mt-1 text-lg font-black">Caso 001</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-white/70">Dispensación correcta de medicamentos según prescripción médica.</p>
      </div>

      <div className="absolute right-4 top-4 w-[min(42vw,22rem)] rounded-xl border border-white/10 bg-black/70 px-4 py-3 shadow-xl backdrop-blur-lg md:right-5 md:top-5">
        <div className="flex items-center justify-between text-[0.68rem] font-black uppercase tracking-[0.1em] text-white/80">
          <span>Progreso del caso</span>
          <span>3 / 10</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[30%] rounded-full bg-violet-500" />
        </div>
      </div>

      <div className="absolute right-5 top-32 hidden w-[17rem] rounded-2xl border border-white/10 bg-[#17131f]/90 p-5 shadow-2xl backdrop-blur-xl lg:block">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-300">Tarea actual</p>
        <div className="mt-4 space-y-3">
          {tasks.map((task, index) => (
            <div className="flex items-start gap-3" key={task.label}>
              <span className={task.done ? "grid size-5 shrink-0 place-items-center rounded-full bg-emerald-400 text-[0.68rem] font-black text-emerald-950" : "mt-0.5 size-4 shrink-0 rounded-full border border-white/55"}>
                {task.done ? "✓" : ""}
              </span>
              <span className={task.done ? "text-sm font-bold text-white" : "text-sm font-semibold leading-5 text-white/78"}>
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
        <span className="mr-3 rounded-md bg-violet-600 px-2 py-1 text-xs">E</span>
        Interactuar
      </div>

      <div className="absolute bottom-5 right-5 hidden rounded-xl border border-white/10 bg-black/65 px-4 py-3 text-xs font-bold leading-6 text-white/80 shadow-xl backdrop-blur-lg md:block">
        <p><span className="mr-2 rounded border border-white/30 px-1.5 py-0.5">W A S D</span> Mover</p>
        <p><span className="mr-2 rounded border border-white/30 px-1.5 py-0.5">Mouse</span> Mirar</p>
        <p><span className="mr-2 rounded border border-white/30 px-1.5 py-0.5">E</span> Interactuar</p>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.16em] text-white/55 md:hidden">
        Fase 1 · escena base
      </div>
    </div>
  );
}
