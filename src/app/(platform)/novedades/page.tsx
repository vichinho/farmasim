import type { Metadata } from "next";
import Link from "next/link";

import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { trainingContentUpdates } from "@/data/training/content-updates";

export const metadata: Metadata = {
  title: "Novedades | FarmaVerse",
  description: "Contenido y entrenamientos incorporados a la demostración de FarmaVerse.",
};

const typeLabels = {
  case: "Nuevo caso",
  feature: "Nueva función",
  training: "Entrenamiento",
};

export default function UpdatesPage() {
  return (
    <>
      <PageContainer className="space-y-7">
        <header className="max-w-3xl">
          <Badge tone="brand">Versión educativa 1.1</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Contenido actualizado
          </h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">
            Esta pantalla demuestra cómo FarmaVerse puede incorporar nuevos casos, modos y
            entrenamientos después de su publicación.
          </p>
        </header>

        <section aria-labelledby="updates-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold" id="updates-heading">
              Novedades de la demo
            </h2>
            <span className="text-sm font-medium text-[var(--muted)]">
              {trainingContentUpdates.length} actualizaciones
            </span>
          </div>

          <ol className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trainingContentUpdates.map((update) => (
              <li
                className="flex min-h-64 flex-col rounded-3xl border border-[var(--border)] bg-white p-5 shadow-[0_8px_30px_rgb(19_33_60/0.05)]"
                key={update.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone={update.type === "case" ? "warning" : "brand"}>
                    {typeLabels[update.type]}
                  </Badge>
                  <span className="text-xs font-bold text-[var(--muted)]">v{update.version}</span>
                </div>
                <h3 className="mt-5 text-xl font-black">{update.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">
                  {update.description}
                </p>
                <p className="mt-4 text-xs font-semibold text-slate-500">
                  {update.publishedLabel}
                </p>
                {update.caseSlug ? (
                  <Link
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-[var(--brand-strong)] hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
                    href={`/simulaciones/${update.caseSlug}?nivel=${update.type === "training" ? 3 : 1}`}
                  >
                    Abrir entrenamiento
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <p className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
          El catálogo está versionado y separado del motor. En una fase posterior podrá obtenerse
          desde una fuente remota sin reescribir las pantallas del simulador.
        </p>
      </PageContainer>
      <BottomNavigation activeHref="/novedades" />
    </>
  );
}
