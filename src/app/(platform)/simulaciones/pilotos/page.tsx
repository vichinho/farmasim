import type { Metadata } from "next";
import Link from "next/link";

import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { pilotScenarioMatrix } from "@/data/simulation/pilot-scenario-bank";

export const metadata: Metadata = {
  title: "QA de pilotos | FarmaVerse",
  description: "Índice interno para revisar los escenarios piloto del simulador 2D.",
  robots: { index: false, follow: false },
};

const modeLabel = {
  guided: "Guiado",
  practice: "Práctica",
  assessment: "Evaluación",
} as const;

const difficultyLabel = {
  foundational: "Fundacional",
  standard: "Estándar",
  advanced: "Avanzado",
} as const;

const roleLabel = {
  "tens-1": "TENS 1 · Atención",
  "tens-2": "TENS 2 · Preparación",
} as const;

export default function PilotQaIndexPage() {
  return (
    <>
      <PageContainer className="max-w-6xl space-y-6 pb-28">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">QA interno</Badge>
            <Badge tone="warning">No modifica progreso</Badge>
          </div>
          <div>
            <Link className="text-sm font-black text-violet-700" href="/simulaciones">← Volver a simulaciones</Link>
            <h1 className="mt-3 text-3xl font-black text-slate-950">Pilotos del banco de escenarios</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Recorre los 10 pilotos uno por uno antes de incorporarlos al catálogo público. Esta ruta usa el motor real, pero sus intentos se descartan del progreso de la cuenta.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {pilotScenarioMatrix.map((pilot, index) => (
            <article className="rounded-3xl border border-violet-100 bg-white p-5 shadow-[0_14px_45px_rgba(76,48,130,.08)]" key={pilot.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Piloto {String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">{pilot.title.replace(/^Piloto \d+ · /, "")}</h2>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-[.7rem] font-black text-violet-700">{roleLabel[pilot.playerRole]}</span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">{pilot.learningFocus}</p>

              <div className="mt-4 flex flex-wrap gap-2 text-[.7rem] font-black">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700">{modeLabel[pilot.mode]}</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700">{difficultyLabel[pilot.difficulty]}</span>
                <code className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-violet-700">{pilot.challengeKey}</code>
              </div>

              <Link
                className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-violet-700 px-4 text-sm font-black text-white transition hover:bg-violet-800"
                href={`/simulaciones/pilotos/${pilot.id}`}
              >
                Probar escenario
              </Link>
            </article>
          ))}
        </section>

        <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>Regla de QA:</strong> valida claridad visual, rol correcto, comportamiento del distractor, retorno a escena, barreras de seguridad y cierre del caso. Estos pilotos todavía no forman parte de los niveles 1–7.
        </aside>
      </PageContainer>
      <BottomNavigation activeHref="/simulaciones" />
    </>
  );
}
