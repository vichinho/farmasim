import { notFound } from "next/navigation";

import { buildMinimumScenarioReport } from "@/features/simulation-engine/fixtures/report";

export default function SimulationEngineDiagnosticsPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const report = buildMinimumScenarioReport();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">FarmaVerse · Development</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Dynamic Simulation Engine</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Diagnóstico local de las cinco pruebas mínimas. Esta vista no contiene reglas 3D ni componentes especiales por escenario.
          </p>
        </div>

        <div className="space-y-6">
          {report.map((item) => (
            <section key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Prueba {item.id}</p>
                  <h2 className="mt-1 text-xl font-black">{item.title}</h2>
                </div>
                <div className="flex gap-2 text-xs font-bold">
                  <span className={`rounded-full px-3 py-1 ${item.validation.valid ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}>
                    {item.validation.valid ? "Session válida" : "Session inválida"}
                  </span>
                  {item.safety ? (
                    <span className={`rounded-full px-3 py-1 ${item.safety.allowed ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>
                      {item.safety.allowed ? "Safety: permite" : "Safety: bloquea"}
                    </span>
                  ) : null}
                </div>
              </header>

              <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
                <DiagnosticBlock title="ScenarioDefinition" value={item.scenarioDefinition} />
                <DiagnosticBlock title="SimulationSession" value={item.session} />
                <DiagnosticBlock title="EventLog" value={item.events} />
                <DiagnosticBlock title="7 criterios" value={item.criteria} />
                <DiagnosticBlock title="Competencias" value={item.competencies} />
                <DiagnosticBlock title="Desviaciones" value={item.processDeviations} />
                <DiagnosticBlock title="Discrepancias" value={item.discrepancies} />
                <DiagnosticBlock title="Barreras / Safety" value={{ barriers: item.barriers, safety: item.safety }} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function DiagnosticBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="mb-3 text-sm font-black text-violet-200">{title}</h3>
      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
