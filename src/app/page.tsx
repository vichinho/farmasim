import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";

const actions = [
  {
    description: "Practica decisiones en escenarios ficticios.",
    icon: "play" as const,
    title: "Simular",
  },
  {
    description: "Explora cápsulas breves a tu ritmo.",
    icon: "book" as const,
    title: "Aprender",
  },
  {
    description: "Revisa tus avances y próximas metas.",
    icon: "chart" as const,
    title: "Progreso",
  },
];

export default function Home() {
  return (
    <>
      <PageContainer>
        <AppHeader />

        <section className="mt-10">
          <Badge tone="warning">Tu espacio de práctica</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            ¿Qué quieres hacer hoy?
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
            Elige cómo quieres avanzar. Todo el contenido de esta versión es
            demostrativo y no reemplaza protocolos profesionales.
          </p>
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-3" aria-label="Acciones principales">
          {actions.map((action) => (
            <Card key={action.title} className="flex min-h-52 flex-col">
              <div className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-[var(--brand-strong)]">
                <Icon className="size-6" name={action.icon} />
              </div>
              <h2 className="mt-5 text-xl font-bold tracking-tight text-[var(--foreground)]">
                {action.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {action.description}
              </p>
              <Button
                className="mt-auto pt-4"
                disabled
                fullWidth
                variant="secondary"
              >
                Próximamente
              </Button>
            </Card>
          ))}
        </section>

        <Card className="mt-6 bg-[linear-gradient(135deg,#ffffff_0%,#edf8f3_100%)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-strong)]">
                Comienza con confianza
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)]">
                Tu primer avance está por llegar
              </h2>
            </div>
            <Badge tone="brand">Nivel 1</Badge>
          </div>
          <ProgressBar className="mt-6" label="Preparación inicial" value={12} />
        </Card>
      </PageContainer>
      <BottomNavigation />
    </>
  );
}
