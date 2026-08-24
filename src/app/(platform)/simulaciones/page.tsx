import type { Metadata } from "next";

import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { LevelSelector } from "@/features/training/level-selector";
import { loadTrainingLevels } from "@/features/training/load-training-levels";

export const metadata: Metadata = {
  title: "Elige un nivel | FarmaVerse",
  description: "Selecciona una experiencia de simulación en FarmaVerse.",
};

export default async function SimulationsPage() {
  const levels = await loadTrainingLevels();

  return (
    <>
      <PageContainer className="simulation-theme space-y-7 pb-28">
        <header className="max-w-2xl">
          <p className="text-sm font-bold tracking-[0.14em] text-[var(--brand-strong)]">
            SIMULACIONES
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Elige tu nivel de práctica
          </h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">
            Avanza desde un recorrido guiado hasta situaciones con mayor presión. Cada nivel
            entrena habilidades distintas dentro de un entorno completamente ficticio.
          </p>
        </header>

        <LevelSelector levels={levels} />
      </PageContainer>
      <BottomNavigation activeHref="/simulaciones" />
    </>
  );
}
