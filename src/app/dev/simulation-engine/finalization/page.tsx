import { notFound } from "next/navigation";

import { FinalizationClient } from "@/app/dev/simulation-engine/finalization/finalization-client";

export default function SimulationFinalizationDiagnosticsPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">
            FarmaVerse · Development
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Simulation Finalization
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            Contrato de cierre seguro: primero se conserva un checkpoint terminal, luego se persiste el resultado y solo después se limpia la sesión pendiente.
          </p>
        </header>

        <FinalizationClient />
      </div>
    </main>
  );
}
