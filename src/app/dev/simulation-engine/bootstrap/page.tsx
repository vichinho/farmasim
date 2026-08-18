import { notFound } from "next/navigation";

import { BootstrapClient } from "@/app/dev/simulation-engine/bootstrap/bootstrap-client";

export default function SimulationBootstrapDiagnosticsPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">
            FarmaVerse · Development
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Simulation Bootstrap</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            Contrato de apertura de una experiencia jugable: reanudar una sesión pendiente compatible o generar una nueva sin exponer reglas internas del motor.
          </p>
        </header>

        <BootstrapClient />
      </div>
    </main>
  );
}
