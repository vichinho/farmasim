import { notFound } from "next/navigation";

import {
  buildBlockedDeliveryRecoveryReport,
  buildRuntimeReport,
  buildRuntimeStockReport,
} from "@/features/simulation-engine/fixtures/runtime-report";
import { runMinimumScenarioRegressionChecks } from "@/features/simulation-engine/fixtures/regression-checks";

export default function SimulationRuntimeDiagnosticsPage() {
  const regression = runMinimumScenarioRegressionChecks();

  if (process.env.NODE_ENV !== "development") notFound();

  const runtime = buildRuntimeReport();
  const recovery = buildBlockedDeliveryRecoveryReport();
  const stock = buildRuntimeStockReport();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">
            FarmaVerse · Development
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Simulation Runtime</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            Contrato incremental del motor. Las acciones externas se convierten en eventos append-only, la bandeja y el stock se derivan del historial y las decisiones de entrega permanecen bajo control del Safety Engine.
          </p>
          <div className="mt-4 inline-flex rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-black text-emerald-300">
            Regresión interna: {regression.checks.length} comprobaciones OK
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <header className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
              Runtime contract
            </p>
            <h2 className="mt-1 text-xl font-black">Cinco pruebas reproducidas acción por acción</h2>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-xs">
              <thead className="bg-black/20 text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-black">Prueba</th>
                  <th className="px-3 py-3 font-black">Estado</th>
                  <th className="px-3 py-3 font-black">Acciones externas</th>
                  <th className="px-3 py-3 font-black">Eventos del motor</th>
                  <th className="px-3 py-3 font-black">Total EventLog</th>
                  <th className="px-3 py-3 font-black">Safety</th>
                  <th className="px-3 py-3 font-black">Discrepancias bloqueantes</th>
                  <th className="px-3 py-3 font-black">Bandeja</th>
                  <th className="px-5 py-3 font-black">Evento final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {runtime.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="font-black text-violet-200">{item.id}</div>
                      <div className="mt-1 max-w-60 text-slate-300">{item.title}</div>
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 font-black ${
                          item.status === "completed"
                            ? "bg-emerald-400/15 text-emerald-300"
                            : item.status === "delivery-blocked"
                              ? "bg-amber-400/15 text-amber-300"
                              : "bg-sky-400/15 text-sky-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 font-black text-slate-300">{item.externalActions}</td>
                    <td className="px-3 py-4 font-black text-slate-300">{item.generatedEvents}</td>
                    <td className="px-3 py-4 font-black text-slate-300">{item.eventCount}</td>
                    <td className="px-3 py-4">
                      <span
                        className={`font-black ${item.safetyAllowed ? "text-emerald-300" : "text-amber-300"}`}
                      >
                        {item.safetyAllowed ? "Permite" : "Bloquea"}
                      </span>
                    </td>
                    <td className="px-3 py-4 font-black text-slate-300">
                      {item.blockingDiscrepancies}
                    </td>
                    <td className="px-3 py-4 font-mono text-[10px] text-slate-300">
                      {item.trayItems.length > 0
                        ? item.trayItems.map((trayItem) => `${trayItem.presentationId} ×${trayItem.quantity}`).join(", ")
                        : "vacía"}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-300">
                      {item.finalEvent ?? "N/D"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <header className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
              Recovery flow
            </p>
            <h2 className="mt-1 text-xl font-black">Entrega bloqueada → corrección → reintento</h2>
            <p className="mt-2 max-w-4xl text-xs leading-5 text-slate-400">
              La Prueba B se bloquea por concentración incorrecta. El mismo runtime conserva el historial, permite corregir la bandeja y vuelve a consultar Safety al reintentar la entrega.
            </p>
          </header>

          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            <Stat label="Estado inicial" value={recovery.blockedStatus} tone="amber" />
            <Stat label="Discrepancias iniciales" value={String(recovery.blockedDiscrepancies)} tone="amber" />
            <Stat label="Estado tras corregir" value={recovery.completedStatus} tone="emerald" />
            <Stat label="Discrepancias finales" value={String(recovery.finalBlockingDiscrepancies)} tone="emerald" />
          </div>

          <div className="grid gap-4 border-t border-white/10 p-5 sm:p-6 xl:grid-cols-2">
            <DiagnosticBlock
              title="Historial de decisiones"
              value={{
                blockedEvent: recovery.blockedEvent,
                completedEvent: recovery.completedEvent,
                deliveryBlockedEvents: recovery.deliveryBlockedEvents,
                deliveryCompletedEvents: recovery.deliveryCompletedEvents,
                correctionActions: recovery.correctionActions,
                correctionGeneratedEvents: recovery.correctionGeneratedEvents,
                eventCount: recovery.eventCount,
              }}
            />
            <DiagnosticBlock
              title="Estado material final"
              value={{
                trayItems: recovery.trayItems,
                heldItems: recovery.heldItems,
                drawerStock: recovery.drawerStock,
              }}
            />
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <header className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
              Runtime inventory
            </p>
            <h2 className="mt-1 text-xl font-black">Stock de gaveta derivado del EventLog</h2>
            <p className="mt-2 max-w-4xl text-xs leading-5 text-slate-400">
              Un intento de retiro superior al stock se rechaza antes de escribir el evento. Los retiros válidos cambian available → low → out-of-stock y devolver una unidad restaura el stock.
            </p>
          </header>

          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            <StockStat label="Inicial" drawer={stock.initial} />
            <StockStat label="Stock bajo" drawer={stock.low} />
            <StockStat label="Agotado" drawer={stock.empty} />
            <StockStat label="Tras devolución" drawer={stock.restored} />
          </div>

          <div className="grid gap-4 border-t border-white/10 p-5 sm:p-6 xl:grid-cols-2">
            <DiagnosticBlock
              title="Protecciones de inventario"
              value={{
                drawerId: stock.drawerId,
                itemId: stock.itemId,
                overdrawRejected: stock.overdrawRejected,
                acceptedEvents: stock.eventCount,
              }}
            />
            <DiagnosticBlock title="Estado material tras la prueba" value={stock.material} />
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <h2 className="text-lg font-black">Contrato de integración</h2>
          <pre className="mt-4 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-slate-300">{`UI / 3D / Sistema clínico
        ↓
runtime.dispatch({ type, actorId, targetId, metadata })
        ↓
SimulationEventLog (append-only)
        ↓
RuntimeMaterialState + RuntimeInventoryState + SimulationState
        ↓
Evaluators + SafetyEngine
        ↓
SimulationRuntimeSnapshot

La presentación nunca modifica stock ni bandeja directamente.
Tampoco emite delivery.completed ni delivery.blocked.
Esos cambios se derivan o son propiedad del motor.

Después de delivery.blocked el usuario puede corregir el estado material
sin reiniciar la sesión; el EventLog conserva ambos intentos.`}</pre>
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "emerald";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className={`text-lg font-black ${tone === "emerald" ? "text-emerald-300" : "text-amber-300"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs font-bold text-slate-400">{label}</div>
    </div>
  );
}

function StockStat({
  label,
  drawer,
}: {
  label: string;
  drawer: { totalQuantity: number; stockState: string } | undefined;
}) {
  const state = drawer?.stockState ?? "N/D";
  const tone =
    state === "available"
      ? "text-emerald-300"
      : state === "low"
        ? "text-amber-300"
        : "text-rose-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className={`text-lg font-black ${tone}`}>{drawer?.totalQuantity ?? "N/D"}</div>
      <div className="mt-1 text-xs font-bold text-slate-400">{label}</div>
      <div className={`mt-2 text-[11px] font-black ${tone}`}>{state}</div>
    </div>
  );
}

function DiagnosticBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="mb-3 text-sm font-black text-violet-200">{title}</h3>
      <pre className="max-h-[24rem] overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
