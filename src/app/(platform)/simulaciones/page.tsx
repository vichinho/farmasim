import type { Metadata } from "next";

import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { LevelSelector } from "@/features/training/level-selector";

export const metadata: Metadata = {
  title: "Elige un nivel | FarmaSim",
  description: "Selecciona una experiencia de simulación en FarmaSim.",
};

export default function SimulationsPage() {
  return (
    <>
      <PageContainer className="space-y-7">
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

        <LevelSelector />
      </PageContainer>
      <BottomNavigation activeHref="/simulaciones" />
    </>
  );
}
