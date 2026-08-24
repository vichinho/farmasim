import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { getTrainingCaseBySlug, getTrainingModeByLevelId, trainingCases } from "@/data/training";
import { loadTrainingLevels } from "@/features/training/load-training-levels";
import { Simulation2DExperience } from "@/features/training/simulation-2d-experience";

export function generateStaticParams() {
  return trainingCases.map((trainingCase) => ({ slug: trainingCase.id }));
}

export async function generateMetadata({ params }: PageProps<"/simulaciones/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const trainingCase = getTrainingCaseBySlug(slug);
  return {
    title: trainingCase ? `${trainingCase.title} | FarmaVerse` : "Caso no encontrado | FarmaVerse",
    description: trainingCase?.description,
  };
}

export default async function TrainingCasePage({ params, searchParams }: PageProps<"/simulaciones/[slug]">) {
  const [{ slug }, query, resolvedLevels] = await Promise.all([params, searchParams, loadTrainingLevels()]);
  const trainingCase = getTrainingCaseBySlug(slug);
  if (!trainingCase) notFound();

  const requestedLevel = typeof query.nivel === "string" ? Number(query.nivel) : 1;
  const trainingLevel = resolvedLevels.find(
    (level) =>
      level.number === requestedLevel &&
      (level.status === "available" || level.status === "completed") &&
      level.caseSlugs.includes(trainingCase.id),
  );
  if (!trainingLevel) redirect("/simulaciones");

  const trainingMode = getTrainingModeByLevelId(trainingLevel.id);
  return (
    <PageContainer className="simulation-theme max-w-[1600px] space-y-4 pb-6 sm:pb-10">
        <header className="sr-only">
          <Link href="/simulaciones">Volver a niveles</Link>
          <Badge tone="brand">Nivel {trainingLevel.number} · {trainingLevel.title}</Badge>
          <Badge tone="warning">Caso ficticio</Badge>
          <h1>{trainingCase.title}</h1>
          <p>{trainingCase.description}</p>
        </header>

        <Simulation2DExperience levelNumber={trainingLevel.number} mode={trainingMode} trainingCase={trainingCase} />
    </PageContainer>
  );
}
