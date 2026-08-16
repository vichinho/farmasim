import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import {
  getTrainingCaseBySlug,
  getTrainingModeByLevelId,
  trainingCases,
} from "@/data/training";
import { Case001ExperienceV7 } from "@/features/training/case001-experience-v7";
import { ContextualDispensingExperience } from "@/features/training/contextual-dispensing-experience";
import { ContextualStorageExperience } from "@/features/training/contextual-storage-experience";
import { loadTrainingLevels } from "@/features/training/load-training-levels";

export function generateStaticParams() {
  return trainingCases.map((trainingCase) => ({ slug: trainingCase.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/simulaciones/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const trainingCase = getTrainingCaseBySlug(slug);

  return {
    title: trainingCase ? `${trainingCase.title} | FarmaVerse` : "Caso no encontrado | FarmaVerse",
    description: trainingCase?.description,
  };
}

export default async function TrainingCasePage({
  params,
  searchParams,
}: PageProps<"/simulaciones/[slug]">) {
  const [{ slug }, query, resolvedLevels] = await Promise.all([
    params,
    searchParams,
    loadTrainingLevels(),
  ]);
  const trainingCase = getTrainingCaseBySlug(slug);

  if (!trainingCase) {
    notFound();
  }

  const requestedLevel = typeof query.nivel === "string" ? Number(query.nivel) : 1;
  const trainingLevel = resolvedLevels.find(
    (level) =>
      level.number === requestedLevel &&
      (level.status === "available" || level.status === "completed") &&
      level.caseSlugs.includes(trainingCase.id),
  );

  if (!trainingLevel) {
    redirect("/simulaciones");
  }

  const trainingMode = getTrainingModeByLevelId(trainingLevel.id);
  const isCase001 = trainingCase.id === "case-001-ambulatory-dispensing";
  const isStorageCase = trainingCase.id === "case-005-storage-review";
  const nextTrainingCase = trainingCases[trainingLevel.number];
  const nextCaseHref = nextTrainingCase
    ? `/simulaciones/${nextTrainingCase.id}?nivel=${trainingLevel.number + 1}`
    : null;

  const simulationClassName = isCase001
    ? "case001-responsive simulation-desktop-panel simulation-case001"
    : isStorageCase
      ? "case001-responsive simulation-desktop-panel simulation-storage-case"
      : "case001-responsive simulation-desktop-panel simulation-dispensing-case";

  return (
    <>
      <PageContainer className="max-w-[1600px] space-y-4 pb-28 md:pb-28">
        <header className="sr-only">
          <Link
            className="inline-flex min-h-11 items-center rounded-xl px-1 text-sm font-semibold text-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
            href="/simulaciones"
          >
            <span aria-hidden="true" className="mr-2">←</span>
            Volver a niveles
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="brand">Nivel {trainingLevel.number} · {trainingLevel.title}</Badge>
            <Badge tone="warning">Caso demostrativo</Badge>
          </div>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            {trainingCase.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            {trainingCase.description}
          </p>
        </header>

        <div className={simulationClassName}>
          <style>{`
            .simulation-next-case-link {
              display: none;
            }

            @media (min-width: 1280px) {
              .simulation-desktop-panel > div > div.grid > div:first-child > div.relative {
                overflow: visible !important;
              }

              /* Interacción principal: columna derecha superior. */
              .simulation-desktop-panel > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"] {
                left: calc(100% + 1rem) !important;
                right: auto !important;
                top: 1rem !important;
                bottom: auto !important;
                width: 25.5rem !important;
                z-index: 40 !important;
              }

              .simulation-desktop-panel > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"] > div {
                max-height: 29rem !important;
                padding: 1rem !important;
                border-radius: 1rem !important;
                background: rgba(255, 255, 255, 0.98) !important;
                box-shadow: 0 10px 28px rgba(17, 24, 39, 0.1) !important;
              }

              .simulation-desktop-panel > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"] h2 {
                font-size: 1.08rem !important;
                line-height: 1.3 !important;
              }

              .simulation-desktop-panel > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"] button {
                min-height: 2.45rem !important;
              }

              /* Misión, información disponible y evento: columna derecha inferior. */
              .simulation-desktop-panel > div > div.grid > aside {
                padding: 30.5rem 1rem 1rem !important;
                background: #fcfcfe !important;
              }

              .simulation-desktop-panel > div > div.grid > aside > div {
                padding: 0.85rem !important;
                border-radius: 0.9rem !important;
                box-shadow: none !important;
              }

              .simulation-desktop-panel > div > div.grid > aside > div p,
              .simulation-desktop-panel > div > div.grid > aside > div li {
                font-size: 0.75rem !important;
                line-height: 1.45 !important;
              }

              .simulation-desktop-panel > div > div.grid > aside > div h3 {
                font-size: 0.86rem !important;
              }

              /* Caso 001 conserva su señal de resultado validada. */
              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)) > div > div.grid {
                display: block !important;
              }

              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)) > div > div.grid > aside {
                display: none !important;
              }

              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)) > div > div.grid > div:first-child {
                border-right: 0 !important;
                border-bottom: 0 !important;
              }

              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)) > div > div.grid > div:first-child > div.relative {
                min-height: 0 !important;
                overflow: visible !important;
                background: white !important;
                padding: 2rem !important;
              }

              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)) > div > div.grid > div:first-child > div.relative > div.absolute.inset-0.overflow-hidden,
              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)) > div > div.grid > div:first-child > div.relative > div[class*="rounded-[45%]"] {
                display: none !important;
              }

              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)) > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"] {
                position: relative !important;
                inset: auto !important;
                left: auto !important;
                right: auto !important;
                top: auto !important;
                bottom: auto !important;
                width: min(52rem, 100%) !important;
                margin: 0 auto !important;
              }

              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)) > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"] > div {
                max-height: none !important;
                padding: 1.35rem !important;
                box-shadow: 0 12px 34px rgba(17, 24, 39, 0.08) !important;
              }

              /* Casos 002-007: el resultado real se reconoce cuando su aside queda vacío. */
              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty) > div > div.grid {
                display: block !important;
              }

              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty) > div > div.grid > aside {
                display: none !important;
              }

              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty) > div > div.grid > div:first-child {
                border-right: 0 !important;
                border-bottom: 0 !important;
              }

              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty) > div > div.grid > div:first-child > div.relative {
                min-height: 0 !important;
                overflow: visible !important;
                background: white !important;
                padding: 2rem !important;
              }

              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty) > div > div.grid > div:first-child > div.relative > div.absolute.inset-0.overflow-hidden,
              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty) > div > div.grid > div:first-child > div.relative > div[class*="rounded-[45%]"] {
                display: none !important;
              }

              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty) > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"] {
                position: relative !important;
                inset: auto !important;
                left: auto !important;
                right: auto !important;
                top: auto !important;
                bottom: auto !important;
                width: min(52rem, 100%) !important;
                margin: 0 auto !important;
              }

              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty) > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"] > div {
                max-height: none !important;
                padding: 1.35rem !important;
                box-shadow: 0 12px 34px rgba(17, 24, 39, 0.08) !important;
              }

              /* CTA de reinicio consistente en las vistas finales. */
              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)) button.rounded-xl.border.border-violet-200.font-bold.text-violet-700,
              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty) button.rounded-xl.border.border-violet-200.font-bold.text-violet-700 {
                font-size: 0 !important;
              }

              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)) button.rounded-xl.border.border-violet-200.font-bold.text-violet-700::after,
              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty) button.rounded-xl.border.border-violet-200.font-bold.text-violet-700::after {
                content: "Volver a repetir";
                font-size: 0.9rem;
              }

              /* Siguiente caso: solo en resultado y sin refuerzos/intercepciones. */
              .simulation-case001:has(> div > header [style*="width: 100%"]):not(:has(.text-rose-600)):not(:has(span.bg-amber-100)):not(:has(span.bg-rose-100)):not(:has(span.bg-amber-50)):not(:has(span.bg-rose-50)) > .simulation-next-case-link,
              .simulation-desktop-panel:not(.simulation-case001):has(> div > div.grid > aside:empty):not(:has(span.bg-amber-100)):not(:has(span.bg-rose-100)):not(:has(span.bg-amber-50)):not(:has(span.bg-rose-50)) > .simulation-next-case-link {
                display: flex;
                width: min(52rem, 100%);
                min-height: 3rem;
                margin: 1rem auto 0;
                align-items: center;
                justify-content: center;
                border-radius: 0.9rem;
                background: rgb(109 40 217);
                padding: 0.75rem 1rem;
                font-weight: 800;
                color: white;
                box-shadow: 0 10px 24px rgba(109, 40, 217, 0.18);
              }
            }
          `}</style>

          {isCase001 ? (
            <Case001ExperienceV7
              key={`${trainingMode.id}-v7`}
              levelNumber={trainingLevel.number}
              mode={trainingMode}
              trainingCase={trainingCase}
            />
          ) : isStorageCase ? (
            <ContextualStorageExperience
              key={`${trainingMode.id}-storage-contextual`}
              levelNumber={trainingLevel.number}
              mode={trainingMode}
              trainingCase={trainingCase}
            />
          ) : (
            <ContextualDispensingExperience
              key={`${trainingMode.id}-${trainingCase.id}-contextual`}
              levelNumber={trainingLevel.number}
              mode={trainingMode}
              trainingCase={trainingCase}
            />
          )}

          {nextCaseHref ? (
            <Link className="simulation-next-case-link" href={nextCaseHref}>
              Siguiente caso
            </Link>
          ) : null}
        </div>
      </PageContainer>
      <BottomNavigation activeHref="/simulaciones" />
    </>
  );
}
