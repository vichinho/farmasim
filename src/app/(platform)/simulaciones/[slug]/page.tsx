import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { getTrainingCaseBySlug, trainingCases, trainingLevels } from "@/data/training";
import { TrainingSession } from "@/features/training/training-session";

export function generateStaticParams() {
  return trainingCases.map((trainingCase) => ({ slug: trainingCase.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/simulaciones/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const trainingCase = getTrainingCaseBySlug(slug);

  return {
    title: trainingCase ? `${trainingCase.title} | FarmaSim` : "Caso no encontrado | FarmaSim",
    description: trainingCase?.description,
  };
}

export default async function TrainingCasePage({ params }: PageProps<"/simulaciones/[slug]">) {
  const { slug } = await params;
  const trainingCase = getTrainingCaseBySlug(slug);

  if (!trainingCase) {
    notFound();
  }

  const trainingLevel = trainingLevels.find((level) => level.id === trainingCase.levelId);

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

        <TrainingSession trainingCase={trainingCase} />
      </PageContainer>
      <BottomNavigation activeHref="/simulaciones" />
    </>
  );
}
