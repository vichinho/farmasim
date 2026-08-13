import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { logout } from "@/features/auth/actions";
import { getLevelProgress, XP_PER_LEVEL } from "@/lib/progression";

type DashboardOverviewProps = {
  completedModules: number;
  fullName: string;
  level: number;
  simulationsThisWeek: number;
  totalXp: number;
};

export function DashboardOverview({
  completedModules,
  fullName,
  level,
  simulationsThisWeek,
  totalXp,
}: DashboardOverviewProps) {
  const { currentLevelXp, percentage: xpProgress } = getLevelProgress(totalXp);

  return (
    <>
      <PageContainer className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <AppHeader eyebrow="FARMA SIM" title="Tu espacio de capacitación" />
          <form action={logout}>
            <Button className="shrink-0" size="sm" type="submit" variant="ghost">
              Salir
            </Button>
          </form>
        </div>

        <section aria-labelledby="dashboard-greeting">
          <p className="text-sm font-semibold text-[var(--brand-strong)]">Tu jornada comienza aquí</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl" id="dashboard-greeting">
            Hola, {fullName}
          </h1>
          <p className="mt-2 text-base leading-7 text-[var(--muted)]">¿Qué quieres hacer hoy?</p>
        </section>

        <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-strong)]">Tu progreso</p>
              <h2 className="mt-1 text-2xl font-bold">Nivel {level}</h2>
            </div>
            <Badge tone="warning">{totalXp} XP</Badge>
          </div>
          <ProgressBar
            className="mt-5"
            label={`${currentLevelXp} de ${XP_PER_LEVEL} XP para el nivel ${level + 1}`}
            value={xpProgress}
          />
        </Card>

        <section aria-labelledby="actions-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold" id="actions-heading">Elige tu siguiente paso</h2>
            <Badge tone="brand">A tu ritmo</Badge>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Card className="border-emerald-200 bg-emerald-50">
              <p className="text-xs font-bold tracking-[0.14em] text-[var(--brand-strong)]">CAPACITACIÓN</p>
              <h3 className="mt-2 text-lg font-bold">Continuar capacitación</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Retoma tus cápsulas cortas cuando estén disponibles.
              </p>
              <Badge className="mt-4" tone="neutral">Próximamente</Badge>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <p className="text-xs font-bold tracking-[0.14em] text-amber-800">SIMULACIONES</p>
              <h3 className="mt-2 text-lg font-bold">Simular</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Explora una práctica técnica con decisiones y feedback inmediato.
              </p>
              <Link
                className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
                href="/simulaciones"
              >
                Iniciar práctica
              </Link>
            </Card>

            <Card className="sm:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--brand-strong)]">Cápsula rápida</p>
                  <h3 className="mt-1 text-lg font-bold">Tu primera cápsula estará aquí</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                    Contenido breve, ficticio y pendiente de validación profesional cuando corresponda.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section aria-label="Resumen de actividad" className="grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold text-[var(--muted)]">Progreso semanal</p>
            <p className="mt-3 text-3xl font-bold text-[var(--brand-strong)]">{simulationsThisWeek}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {simulationsThisWeek === 1 ? "simulación esta semana" : "simulaciones esta semana"}
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-[var(--muted)]">Módulos completados</p>
            <p className="mt-3 text-3xl font-bold text-[var(--brand-strong)]">{completedModules}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Tu avance se guardará aquí.</p>
          </Card>
        </section>

        <section aria-labelledby="activity-heading">
          <h2 className="text-xl font-bold" id="activity-heading">Actividad reciente</h2>
          <Card className="mt-3 border-dashed bg-slate-50 text-center">
            <h3 className="font-bold">Aún no tienes actividad</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Cuando completes una simulación o una cápsula, podrás ver tu avance aquí.
            </p>
          </Card>
        </section>
      </PageContainer>
      <BottomNavigation activeHref="/dashboard" />
    </>
  );
}
