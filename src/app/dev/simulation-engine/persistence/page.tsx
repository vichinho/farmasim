import { notFound } from "next/navigation";

import { runPersistenceRegressionChecks } from "@/features/simulation-engine/fixtures/persistence-regression";

export default function SimulationPersistenceDiagnosticsPage() {
  const regression = runPersistenceRegressionChecks();

  if (process.env.NODE_ENV !== "development") notFound();

  const { report } = regression;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">
            FarmaVerse · Development
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Session Persistence</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            Checkpoint versionado de ScenarioDefinition + SimulationSession + EventLog. El estado derivado no se persiste: se reconstruye al reanudar.
          </p>
          <div className="mt-4 inline-flex rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-black text-emerald-300">
            Persistencia: {regression.checks.length} comprobaciones OK
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <Stat label="Checkpoint version" value={String(report.checkpointVersion)} ok />
          <Stat label="Atención reproduce" value={report.attention.replayEqual ? "Sí" : "No"} ok={report.attention.replayEqual} />
          <Stat label="Preparación reproduce" value={report.preparation.replayEqual ? "Sí" : "No"} ok={report.preparation.replayEqual} />
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <header className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Clinical resume</p>
            <h2 className="mt-1 text-xl font-black">Atención · sistema clínico</h2>
          </header>
          <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
            <DiagnosticBlock title="Checkpoint / restore" value={report.attention} />
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-slate-300">
              <p>El paciente activo y los registros abiertos se reconstruyen desde los eventos.</p>
              <p className="mt-3">Después del restore, la siguiente acción continúa el EventLog sin reiniciar la secuencia.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <header className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Material resume</p>
            <h2 className="mt-1 text-xl font-black">Preparación · stock + bandeja + handoff</h2>
          </header>
          <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
            <DiagnosticBlock title="Antes / después de restaurar" value={report.preparation} />
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-slate-300">
              <p>El medicamento sostenido y el stock descontado no se guardan como campos duplicados.</p>
              <p className="mt-3">Se reconstruyen reproduciendo el EventLog y luego la sesión puede continuar hasta `tray.sent`.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <header className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Integrity guard</p>
            <h2 className="mt-1 text-xl font-black">Checkpoint adulterado</h2>
          </header>
          <div className="p-5 sm:p-6">
            <Stat
              label="Secuencia corrupta rechazada"
              value={report.guards.corruptedCheckpointRejected ? "Sí" : "No"}
              ok={report.guards.corruptedCheckpointRejected}
            />
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <h2 className="text-lg font-black">Fuente de verdad persistida</h2>
          <pre className="mt-4 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-slate-300">{`Checkpoint v1
  ScenarioDefinition
  SimulationSession
  SimulationEvent[]

NO se guarda por separado:
  bandeja derivada
  stock derivado
  handoff derivado
  estado del PC derivado
  criterios
  competencias
  Safety

Restore
  ↓
EventLog hidratado
  ↓
Material + Inventory + ClinicalState + Handoff
  ↓
mismo snapshot público
  ↓
continuar sesión`}</pre>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className={`text-lg font-black ${ok ? "text-emerald-300" : "text-rose-300"}`}>{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-400">{label}</div>
    </div>
  );
}

function DiagnosticBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="mb-3 text-sm font-black text-violet-200">{title}</h3>
      <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
