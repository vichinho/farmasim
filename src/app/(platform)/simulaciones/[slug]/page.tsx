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
import { Case001ExperienceV2 } from "@/features/training/case001-experience-v2";
import { TrainingSession } from "@/features/training/training-session";
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
  const isInteractiveCase001 = trainingCase.id === "case-001-ambulatory-dispensing";

  return (
    <>
      <PageContainer className={isInteractiveCase001 ? "max-w-[1600px] space-y-4" : "max-w-6xl space-y-6"}>
        <header className={isInteractiveCase001 ? "sr-only" : undefined}>
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

        {isInteractiveCase001 ? (
          <Case001ExperienceV2
            key={`${trainingMode.id}-v2`}
            levelNumber={trainingLevel.number}
            mode={trainingMode}
            trainingCase={trainingCase}
          />
        ) : (
          <TrainingSession
            key={trainingMode.id}
            levelNumber={trainingLevel.number}
            mode={trainingMode}
            trainingCase={trainingCase}
          />
        )}
      </PageContainer>
      <BottomNavigation activeHref="/simulaciones" />
    </>
  );
}
