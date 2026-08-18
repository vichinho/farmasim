import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getLevelProgress, XP_PER_LEVEL } from "@/lib/progression";
import type { ContentTraceabilityRecord } from "@/types/training-simulation";

type AchievementSummary = {
  description: string;
  name: string;
  unlockedAt: string;
};

type RecentAttempt = {
  completedAt: string;
  score: number;
  title: string;
  xpEarned: number;
};

type CriterionIndicator = {
  intercepted: number;
  met: number;
  reinforcement: number;
  title: string;
};

type ProgressOverviewProps = {
  achievements: AchievementSummary[];
  assessedCriteria: number;
  completedModules: number;
  criteriaIndicators: CriterionIndicator[];
  fullName: string;
  level: number;
  precision: number;
  recentAttempts: RecentAttempt[];
  simulationsCompleted: number;
  documentedSources: number;
  totalXp: number;
  traceabilityRecord: ContentTraceabilityRecord;
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function ProgressOverview({
  achievements,
  assessedCriteria,
  completedModules,
  criteriaIndicators,
  fullName,
  level,
  precision,
  recentAttempts,
  simulationsCompleted,
  documentedSources,
  totalXp,
  traceabilityRecord,
}: ProgressOverviewProps) {
  const { currentLevelXp, percentage } = getLevelProgress(totalXp);
  const practicedIndicators = criteriaIndicators
    .filter((indicator) => indicator.met + indicator.intercepted + indicator.reinforcement > 0)
    .map((indicator) => {
      const total = indicator.met + indicator.intercepted + indicator.reinforcement;
      return {
        ...indicator,
        safePercentage: Math.round(((indicator.met + indicator.intercepted) / total) * 100),
        total,
      };
    });
  const priorities = practicedIndicators
    .filter((indicator) => indicator.reinforcement > 0)
    .toSorted((a, b) => b.reinforcement - a.reinforcement)
    .slice(0, 2);
  const strengths = practicedIndicators
    .filter((indicator) => indicator.reinforcement === 0)
    .toSorted((a, b) => b.safePercentage - a.safePercentage)
    .slice(0, 3);
  const latestAttempt = recentAttempts[0];

  return (
    <>
      <PageContainer className="space-y-5 pb-28">
        <AppHeader eyebrow="TU AVANCE" title={`Progreso de ${fullName}`} />

        <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-[var(--brand-strong)]">Nivel {level}</p>
            <Badge tone="warning">{totalXp} XP</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Vas por buen camino</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Revisa tu próximo foco de práctica y continúa cuando te sientas preparado.
          </p>
          <ProgressBar
            className="mt-5"
            label={`${currentLevelXp} de ${XP_PER_LEVEL} XP para avanzar`}
            value={percentage}
          />
          <dl className="mt-5 flex items-stretch border-t border-emerald-200/70 pt-4 text-center">
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 sm:flex-row sm:gap-2">
              <dd className="text-lg font-black text-[var(--brand-strong)]">{completedModules}/7</dd>
              <dt className="text-[.68rem] font-semibold text-[var(--muted)] sm:text-xs">Niveles</dt>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center border-x border-emerald-200/70 px-2 sm:flex-row sm:gap-2">
              <dd className="text-lg font-black text-[var(--brand-strong)]">{precision}%</dd>
              <dt className="text-[.68rem] font-semibold text-[var(--muted)] sm:text-xs">Precisión</dt>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 sm:flex-row sm:gap-2">
              <dd className="text-lg font-black text-[var(--brand-strong)]">{simulationsCompleted}</dd>
              <dt className="text-[.68rem] font-semibold text-[var(--muted)] sm:text-xs">Prácticas</dt>
            </div>
          </dl>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)] lg:items-start">
          <section aria-labelledby="practice-focus-heading">
            <Card className="min-w-0 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-violet-600">Orientación personal</p>
                  <h2 className="mt-1 text-xl font-bold" id="practice-focus-heading">Tu foco de práctica</h2>
                </div>
                <Badge tone={priorities.length ? "warning" : "brand"}>
                  {priorities.length ? "Hay algo por reforzar" : "Todo al día"}
                </Badge>
              </div>

          {assessedCriteria > 0 ? (
                <div className="mt-5 space-y-5">
                  {priorities.length ? (
                    <div>
                      <h3 className="text-sm font-bold text-amber-900">Practica esto a continuación</h3>
                      <div className="mt-2 space-y-2">
                        {priorities.map((indicator) => (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4" key={indicator.title}>
                            <p className="text-sm font-bold leading-6 text-amber-950">{indicator.title}</p>
                            <p className="mt-1 text-xs leading-5 text-amber-800">Vuelve a intentarlo en una práctica guiada.</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="font-bold text-emerald-950">Tus acciones observadas están consolidadas</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-800">Puedes avanzar o repetir un caso para mantener la práctica.</p>
                    </div>
                  )}

                  {strengths.length ? (
                    <div>
                      <h3 className="text-sm font-bold">Fortalezas observadas</h3>
                      <ul className="mt-2 space-y-2">
                        {strengths.map((indicator) => (
                          <li className="flex gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-6" key={indicator.title}>
                            <span aria-hidden="true" className="font-black text-emerald-600">✓</span>
                            {indicator.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <details className="rounded-2xl border border-slate-200 bg-slate-50/70">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[var(--brand-strong)]">
                      Ver detalle de los {practicedIndicators.length} criterios
                    </summary>
                    <div className="space-y-3 border-t border-slate-200 p-4">
                      {practicedIndicators.map((indicator) => (
                        <div key={indicator.title}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-semibold leading-5">{indicator.title}</p>
                            <span className="shrink-0 text-xs font-black text-[var(--brand-strong)]">{indicator.safePercentage}%</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${indicator.safePercentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
          ) : (
                <div className="mt-5 rounded-2xl border border-dashed bg-slate-50 p-4">
              <p className="font-bold">Aún no hay criterios registrados</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Completa el caso de dispensación para ver indicadores de sus siete acciones observables.
              </p>
                </div>
          )}
            </Card>
          </section>

          <aside className="space-y-5">
            <Card className="p-5" aria-labelledby="activity-heading">
              <p className="text-xs font-black uppercase tracking-wider text-violet-600">Último resultado</p>
              <h2 className="mt-1 text-lg font-bold" id="activity-heading">Actividad reciente</h2>
              {latestAttempt ? (
                <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold leading-6">{latestAttempt.title}</h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">{dateFormatter.format(new Date(latestAttempt.completedAt))}</p>
                    </div>
                    <Badge tone="brand">{latestAttempt.score}%</Badge>
                  </div>
                  {recentAttempts.length > 1 ? (
                    <details className="mt-4 border-t border-slate-100 pt-3">
                      <summary className="cursor-pointer text-sm font-bold text-[var(--brand-strong)]">Ver historial reciente</summary>
                      <ol className="mt-3 space-y-3">
                        {recentAttempts.slice(1).map((attempt) => (
                          <li className="flex items-start justify-between gap-3 text-xs" key={`${attempt.completedAt}-${attempt.title}`}>
                            <div><p className="font-semibold leading-5">{attempt.title}</p><p className="text-[var(--muted)]">{dateFormatter.format(new Date(attempt.completedAt))}</p></div>
                            <span className="font-black text-[var(--brand-strong)]">{attempt.score}%</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  ) : null}
                </div>
              ) : <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Tus resultados aparecerán al terminar una simulación.</p>}
            </Card>

            <Card className="border-amber-200 bg-amber-50 p-5" aria-labelledby="achievements-heading">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold" id="achievements-heading">Insignias</h2>
                <Badge tone="warning">{achievements.length}</Badge>
              </div>
              {achievements[0] ? (
                <div className="mt-3"><p className="font-bold text-amber-950">{achievements[0].name}</p><p className="mt-1 text-sm leading-6 text-amber-900">{achievements[0].description}</p></div>
              ) : <p className="mt-3 text-sm text-amber-900">Completa una simulación para desbloquear la primera.</p>}
            </Card>
          </aside>
        </div>

        <details className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sky-950">
          <summary className="cursor-pointer text-sm font-bold">Información sobre estos indicadores</summary>
          <div className="mt-3 space-y-2 border-t border-sky-200 pt-3 text-sm leading-6">
            <p>{documentedSources} fuentes documentales registradas.</p>
            <p>{traceabilityRecord.statement} Alcance: {traceabilityRecord.scope}</p>
            <p>Estos indicadores no certifican competencia clínica ni reemplazan la evaluación institucional. Las situaciones no previstas se derivan al QF.</p>
          </div>
        </details>
      </PageContainer>
      <BottomNavigation activeHref="/progreso" />
    </>
  );
}
