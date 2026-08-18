import { notFound } from "next/navigation";

import { PresentationAdapterClient } from "@/app/dev/simulation-engine/presentation/presentation-client";

export default function SimulationPresentationPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-300">
            FarmaVerse · Development
          </p>
          <h1 className="mt-4 text-4xl font-black">Simulation Presentation Adapter</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-sky-200/80">
            Frontera final para una experiencia jugable: React consume snapshot + comandos sin importar Runtime, SafetyEngine, serialización ni Supabase.
          </p>
        </header>

        <PresentationAdapterClient />

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-xl font-black">Contrato que recibe la capa visual</h2>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-300">
{`const experience = useSimulationExperience(config)

experience.state?.snapshot  // datos públicos para renderizar
experience.dispatch(action) // acción del jugador
experience.save()           // checkpoint
experience.finalize()       // resultado + progreso + cleanup seguro
experience.discard()        // abandono explícito

La UI no importa:
- SimulationRuntime
- SafetyEngine
- evaluators
- serializer
- checkpoint Server Actions
- Supabase`}
          </pre>
        </section>
      </div>
    </main>
  );
}
