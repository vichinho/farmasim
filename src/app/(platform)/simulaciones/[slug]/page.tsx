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

        <div className={isCase001 ? "case001-responsive case001-desktop-panel-test" : "case001-responsive"}>
          {isCase001 ? (
            <>
              <style>{`
                .case001-next-case-link {
                  display: none;
                }

                @media (min-width: 1280px) {
                  .case001-desktop-panel-test > div > div.grid > div:first-child > div.relative {
                    overflow: visible !important;
                  }

                  /* La interacción vive visualmente en la columna derecha, no sobre la escena. */
                  .case001-desktop-panel-test > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"][class*="w-[min(92%,27rem)]"] {
                    left: calc(100% + 1rem) !important;
                    right: auto !important;
                    top: 1rem !important;
                    bottom: auto !important;
                    width: 25.5rem !important;
                    z-index: 40 !important;
                  }

                  .case001-desktop-panel-test > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"][class*="w-[min(92%,27rem)]"] > div {
                    max-height: 29rem !important;
                    padding: 1rem !important;
                    border-radius: 1rem !important;
                    background: rgba(255, 255, 255, 0.98) !important;
                    box-shadow: 0 10px 28px rgba(17, 24, 39, 0.1) !important;
                  }

                  .case001-desktop-panel-test > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"][class*="w-[min(92%,27rem)]"] h2 {
                    font-size: 1.08rem !important;
                    line-height: 1.3 !important;
                  }

                  .case001-desktop-panel-test > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"][class*="w-[min(92%,27rem)]"] button {
                    min-height: 2.45rem !important;
                  }

                  /* Misión e información quedan compactas debajo de la interacción. */
                  .case001-desktop-panel-test > div > div.grid > aside {
                    padding: 30.5rem 1rem 1rem !important;
                    background: #fcfcfe !important;
                  }

                  .case001-desktop-panel-test > div > div.grid > aside > div {
                    padding: 0.85rem !important;
                    border-radius: 0.9rem !important;
                    box-shadow: none !important;
                  }

                  .case001-desktop-panel-test > div > div.grid > aside > div p,
                  .case001-desktop-panel-test > div > div.grid > aside > div li {
                    font-size: 0.75rem !important;
                    line-height: 1.45 !important;
                  }

                  .case001-desktop-panel-test > div > div.grid > aside > div h3 {
                    font-size: 0.86rem !important;
                  }

                  /* Cuando el caso termina, desaparece la escena y queda solo el resultado. */
                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) > div > div.grid {
                    display: block !important;
                  }

                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) > div > div.grid > aside {
                    display: none !important;
                  }

                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) > div > div.grid > div:first-child {
                    border-right: 0 !important;
                    border-bottom: 0 !important;
                  }

                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) > div > div.grid > div:first-child > div.relative {
                    min-height: 0 !important;
                    overflow: visible !important;
                    background: white !important;
                    padding: 2rem !important;
                  }

                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) > div > div.grid > div:first-child > div.relative > div.absolute.inset-0.overflow-hidden,
                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) > div > div.grid > div:first-child > div.relative > div[class*="rounded-[45%]"] {
                    display: none !important;
                  }

                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"][class*="w-[min(92%,27rem)]"] {
                    position: relative !important;
                    inset: auto !important;
                    left: auto !important;
                    right: auto !important;
                    top: auto !important;
                    bottom: auto !important;
                    width: min(52rem, 100%) !important;
                    margin: 0 auto !important;
                  }

                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) > div > div.grid > div:first-child > div.relative > div[class*="bottom-5"][class*="left-5"][class*="w-[min(92%,27rem)]"] > div {
                    max-height: none !important;
                    padding: 1.35rem !important;
                    box-shadow: 0 12px 34px rgba(17, 24, 39, 0.08) !important;
                  }

                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) > div > footer {
                    margin-top: 0 !important;
                  }

                  /* Renombramos el CTA de reinicio únicamente en la vista final. */
                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) button.rounded-xl.border.border-violet-200.font-bold.text-violet-700 {
                    font-size: 0 !important;
                  }

                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"] ) button.rounded-xl.border.border-violet-200.font-bold.text-violet-700::after {
                    content: "Volver a repetir";
                    font-size: 0.9rem;
                  }

                  /* Siguiente caso solo cuando todos los criterios quedaron en Cumple. */
                  .case001-desktop-panel-test:has(> div > header [style*="width: 100%"]):has(.bg-emerald-100):not(:has(.bg-amber-100)):not(:has(.bg-rose-100)) > .case001-next-case-link {
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
              <Case001ExperienceV7
                key={`${trainingMode.id}-v7`}
                levelNumber={trainingLevel.number}
                mode={trainingMode}
                trainingCase={trainingCase}
              />
              <Link
                className="case001-next-case-link"
                href="/simulaciones/case-002-concentration-reinforcement?nivel=2"
              >
                Siguiente caso
              </Link>
            </>
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
        </div>
      </PageContainer>
      <BottomNavigation activeHref="/simulaciones" />
    </>
  );
}