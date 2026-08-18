import { notFound } from "next/navigation";

import { CloudPersistenceClient } from "@/app/dev/simulation-engine/cloud-persistence/cloud-persistence-client";

export default function SimulationCloudPersistencePage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">
            FarmaVerse · Development
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Cloud Persistence</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            Diagnóstico end-to-end de checkpoints autenticados en Supabase. No guarda score, XP ni simulation_attempts.
          </p>
        </header>

        <CloudPersistenceClient />
      </div>
    </main>
  );
}
