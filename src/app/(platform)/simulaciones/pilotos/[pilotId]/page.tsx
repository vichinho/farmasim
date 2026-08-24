import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import {
  getPilotScenarioSpec,
  pilotRuntimeScenarioId,
  pilotScenarioMatrix,
} from "@/data/simulation/pilot-scenario-bank";
import { getTrainingCaseBySlug } from "@/data/training";
import { Simulation2DExperience } from "@/features/training/simulation-2d-experience";
import type { TrainingCase, TrainingMode } from "@/types/training-simulation";

export function generateStaticParams() {
  return pilotScenarioMatrix.map((pilot) => ({ pilotId: pilot.id }));
}

export async function generateMetadata({ params }: PageProps<"/simulaciones/pilotos/[pilotId]">): Promise<Metadata> {
  const { pilotId } = await params;
  const pilot = getPilotScenarioSpec(pilotId);
  return {
    title: pilot ? `${pilot.title} · QA | FarmaVerse` : "Piloto no encontrado | FarmaVerse",
    description: pilot?.learningFocus,
    robots: { index: false, follow: false },
  };
}

function qaModeFor(pilot: NonNullable<ReturnType<typeof getPilotScenarioSpec>>): TrainingMode {
  return {
    id: `qa-${pilot.id}`,
    levelId: "qa-pilot",
    shortLabel: pilot.mode === "guided" ? "QA guiado" : pilot.mode === "practice" ? "QA práctica" : "QA evaluación",
    guidance: pilot.mode === "guided" ? "guided" : pilot.mode === "practice" ? "standard" : "minimal",
    interruptionStageIds: [],
    notice: "Modo QA interno. Este intento no modifica tu progreso.",
  };
}

export default async function PilotQaRunnerPage({ params }: PageProps<"/simulaciones/pilotos/[pilotId]">) {
  const { pilotId } = await params;
  const pilot = getPilotScenarioSpec(pilotId);
  if (!pilot) notFound();

  const shellCase = getTrainingCaseBySlug("case-001-ambulatory-dispensing");
  if (!shellCase) notFound();

  const runtimeCase: TrainingCase = {
    ...shellCase,
    id: pilotRuntimeScenarioId(pilot),
    title: pilot.title,
    description: pilot.learningFocus,
  };

  const currentIndex = pilotScenarioMatrix.findIndex((item) => item.id === pilot.id);
  const previous = currentIndex > 0 ? pilotScenarioMatrix[currentIndex - 1] : undefined;
  const next = currentIndex < pilotScenarioMatrix.length - 1 ? pilotScenarioMatrix[currentIndex + 1] : undefined;

  return (
    <PageContainer className="simulation-theme max-w-[1600px] space-y-4 pb-8 sm:pb-10">
        <header className="rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_10px_35px_rgba(76,48,130,.07)] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link className="text-sm font-black text-violet-700" href="/simulaciones/pilotos">← Volver a pilotos</Link>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="brand">QA interno</Badge>
                <Badge tone="warning">No guarda progreso</Badge>
              </div>
              <h1 className="mt-3 text-2xl font-black text-slate-950">{pilot.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{pilot.learningFocus}</p>
            </div>
            <div className="text-right text-xs font-bold text-slate-500">
              <p>{pilot.playerRole === "tens-1" ? "TENS 1 · Atención" : "TENS 2 · Preparación"}</p>
              <p className="mt-1">{pilot.mode} · {pilot.difficulty}</p>
              <code className="mt-2 block rounded-lg bg-violet-50 px-2 py-1 text-violet-700">{pilot.challengeKey}</code>
            </div>
          </div>
        </header>

        <Simulation2DExperience exitHref="/simulaciones/pilotos" levelNumber={1} mode={qaModeFor(pilot)} trainingCase={runtimeCase} />

        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-4">
          {previous ? (
            <Link className="text-sm font-black text-violet-700" href={`/simulaciones/pilotos/${previous.id}`}>← {previous.title}</Link>
          ) : <span />}
          {next ? (
            <Link className="text-sm font-black text-violet-700" href={`/simulaciones/pilotos/${next.id}`}>{next.title} →</Link>
          ) : <Link className="text-sm font-black text-violet-700" href="/simulaciones/pilotos">Volver al índice</Link>}
        </nav>
    </PageContainer>
  );
}
