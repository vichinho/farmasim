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
  latestAttempt: {
    completedAt: string;
    score: number;
    title: string;
    xpEarned: number;
  } | null;
  level: number;
  recommendedLevel: {
    description: string;
    href: string;
    isReview: boolean;
    number: number;
    title: string;
  };
  simulationsThisWeek: number;
  totalXp: number;
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function DashboardOverview({
  completedModules,
  fullName,
  latestAttempt,
  level,
  recommendedLevel,
  simulationsThisWeek,
  totalXp,
}: DashboardOverviewProps) {
  const { currentLevelXp, percentage: xpProgress } = getLevelProgress(totalXp);

  return (
    <>
      <PageContainer className="space-y-5 pb-28">
        <div className="flex items-start justify-between gap-4">
          <AppHeader title="Tu espacio de aprendizaje" />
          <form action={logout}>
            <Button className="shrink-0" size="sm" type="submit" variant="ghost">
              Salir
            </Button>
          </form>
        </div>

        <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 sm:p-7">
          <div className="grid gap-7 md:grid-cols-[minmax(0,1.15fr)_minmax(17rem,.85fr)] md:items-center">
            <section aria-labelledby="dashboard-greeting">
              <Badge tone="brand">Tu siguiente paso</Badge>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" id="dashboard-greeting">
                Hola, {fullName}
              </h1>
              <p className="mt-2 text-base leading-7 text-[var(--muted)]">
                {recommendedLevel.isReview ? "Mantén tus habilidades activas con una nueva práctica." : "Tienes una práctica lista para continuar tu recorrido."}
              </p>
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/75 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-[var(--brand-strong)]">
                  {recommendedLevel.isReview ? "Práctica recomendada" : `Nivel ${recommendedLevel.number}`}
                </p>
                <h2 className="mt-1 text-lg font-bold">{recommendedLevel.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{recommendedLevel.description}</p>
                <Link className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]" href={recommendedLevel.href}>
                  {recommendedLevel.isReview ? "Volver a practicar" : "Continuar recorrido"}
                  <span aria-hidden="true" className="ml-2">→</span>
                </Link>
              </div>
            </section>

            <section className="border-t border-emerald-200 pt-5 md:border-l md:border-t-0 md:pl-7 md:pt-0" aria-labelledby="dashboard-progress-heading">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-wider text-[var(--brand-strong)]">Tu avance</p><h2 className="mt-1 text-2xl font-bold" id="dashboard-progress-heading">Nivel {level}</h2></div>
                <Badge tone="warning">{totalXp} XP</Badge>
              </div>
              <ProgressBar className="mt-5" label={`${currentLevelXp} de ${XP_PER_LEVEL} XP para avanzar`} value={xpProgress} />
              <dl className="mt-5 flex border-t border-emerald-200/70 pt-4 text-center">
                <div className="flex-1"><dd className="text-xl font-black text-[var(--brand-strong)]">{completedModules}/7</dd><dt className="mt-1 text-xs font-semibold text-[var(--muted)]">Niveles</dt></div>
                <div className="flex-1 border-l border-emerald-200/70"><dd className="text-xl font-black text-[var(--brand-strong)]">{simulationsThisWeek}</dd><dt className="mt-1 text-xs font-semibold text-[var(--muted)]">Esta semana</dt></div>
              </dl>
            </section>
          </div>
        </Card>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Resumen personal">
          <Card className="p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-wider text-violet-600">Último resultado</p>
            {latestAttempt ? <div className="mt-3"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold leading-6">{latestAttempt.title}</h2><p className="mt-1 text-xs text-[var(--muted)]">{dateFormatter.format(new Date(latestAttempt.completedAt))}</p></div><Badge tone="brand">{latestAttempt.score}%</Badge></div><p className="mt-4 text-sm font-semibold text-[var(--brand-strong)]">+{latestAttempt.xpEarned} XP obtenidos</p></div> : <div className="mt-3"><h2 className="font-bold">Tu primer resultado aparecerá aquí</h2><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Completa una simulación para comenzar.</p></div>}
            <Link className="mt-4 inline-flex text-sm font-bold text-[var(--brand-strong)]" href="/progreso">Ver mi progreso <span aria-hidden="true" className="ml-1">→</span></Link>
          </Card>

          <Card className="border-violet-200 bg-violet-50/70 p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-wider text-violet-700">Consejo de práctica</p>
            <h2 className="mt-2 font-bold">Haz una pausa antes de entregar</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Confirma identidad, prescripciones y preparación. Si algo no coincide, utiliza la barrera de seguridad.</p>
            <Link className="mt-4 inline-flex text-sm font-bold text-violet-800" href="/simulaciones">Explorar todos los niveles <span aria-hidden="true" className="ml-1">→</span></Link>
          </Card>
        </section>
      </PageContainer>
      <BottomNavigation activeHref="/dashboard" />
    </>
  );
}
