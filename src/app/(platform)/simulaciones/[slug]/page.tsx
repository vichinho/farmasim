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
  const trainingLevel =
    resolvedLevels.find(
      (level) =>
        level.number === requestedLevel &&
        (level.status === "available" || level.status === "completed") &&
        level.caseSlugs.includes(trainingCase.id),
    );

  if (!trainingLevel) {
    redirect("/simulaciones");
  }
  const trainingMode = getTrainingModeByLevelId(trainingLevel.id);

  return (
    <>
      <PageContainer className="max-w-6xl space-y-6">
        <header>
          <Link
            className="inline-flex min-h-11 items-center rounded-xl px-1 text-sm font-semibold text-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
            href="/simulaciones"
          >
            <span aria-hidden="true" className="mr-2">
              ←
            </span>
            Volver a niveles
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              Nivel {trainingLevel?.number ?? 1} · {trainingLevel?.title ?? "Recorrido guiado"}
            </Badge>
            <Badge tone="warning">Caso demostrativo</Badge>
          </div>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            {trainingCase.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            {trainingCase.description}
          </p>
        </header>

        <TrainingSession
          key={trainingMode.id}
          levelNumber={trainingLevel.number}
          mode={trainingMode}
          trainingCase={trainingCase}
        />
      </PageContainer>
      <BottomNavigation activeHref="/simulaciones" />
    </>
  );
}
