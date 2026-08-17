import { notFound } from "next/navigation";

import {
  buildMinimumScenarioReport,
  buildMinimumScenarioSummary,
} from "@/features/simulation-engine/fixtures/report";

export default function SimulationEngineDiagnosticsPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const report = buildMinimumScenarioReport();
  const summary = buildMinimumScenarioSummary();

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

        <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <header className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Resumen comparativo</p>
            <h2 className="mt-1 text-xl font-black">Cinco pruebas · un solo motor</h2>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-black/20 text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-black">Prueba</th>
                  <th className="px-3 py-3 font-black">Validación</th>
                  <th className="px-3 py-3 font-black">Safety</th>
                  <th className="px-3 py-3 font-black">Criterios fallidos</th>
                  <th className="px-3 py-3 font-black">Competencias fallidas</th>
                  <th className="px-3 py-3 font-black">Desviaciones</th>
                  <th className="px-3 py-3 font-black">Discrepancias</th>
                  <th className="px-3 py-3 font-black">Barreras fallidas</th>
                  <th className="px-5 py-3 font-black">Interceptadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {summary.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="font-black text-violet-200">{item.id}</div>
                      <div className="mt-1 max-w-56 text-slate-300">{item.title}</div>
                    </td>
                    <td className="px-3 py-4">
                      <StatusPill ok={item.valid} okLabel="Válida" failLabel="Inválida" />
                    </td>
                    <td className="px-3 py-4">
                      {item.safetyAllowed === null ? (
                        <span className="text-slate-500">N/D</span>
                      ) : (
                        <StatusPill
                          ok={item.safetyAllowed}
                          okLabel="Permite"
                          failLabel="Bloquea"
                          failTone="amber"
                        />
                      )}
                    </td>
                    <Metric value={item.missedCriteria} />
                    <Metric value={item.missedCompetencies} />
                    <Metric value={item.deviations} />
                    <Metric value={item.discrepancies} />
                    <Metric value={item.barrierFailures} />
                    <Metric value={item.interceptedDiscrepancies} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

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
                <DiagnosticBlock title="Barreras / Safety" value={{ barriers: item.barriers, failures: item.barrierFailures, safety: item.safety }} />
                <DiagnosticBlock title="Ciclo de discrepancias" value={item.discrepancyTransitions} />
                <DiagnosticBlock title="Refuerzo sugerido" value={item.reinforcement} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function StatusPill({
  ok,
  okLabel,
  failLabel,
  failTone = "rose",
}: {
  ok: boolean;
  okLabel: string;
  failLabel: string;
  failTone?: "rose" | "amber";
}) {
  const failClass = failTone === "amber" ? "bg-amber-400/15 text-amber-300" : "bg-rose-400/15 text-rose-300";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 font-black ${ok ? "bg-emerald-400/15 text-emerald-300" : failClass}`}>
      {ok ? okLabel : failLabel}
    </span>
  );
}

function Metric({ value }: { value: number }) {
  return <td className={`px-3 py-4 font-black ${value > 0 ? "text-amber-300" : "text-slate-500"}`}>{value}</td>;
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
