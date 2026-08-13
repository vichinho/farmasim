import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getLevelProgress, XP_PER_LEVEL } from "@/lib/progression";

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

type ProgressOverviewProps = {
  achievements: AchievementSummary[];
  completedModules: number;
  fullName: string;
  level: number;
  precision: number;
  recentAttempts: RecentAttempt[];
  simulationsCompleted: number;
  totalXp: number;
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function ProgressOverview({
  achievements,
  completedModules,
  fullName,
  level,
  precision,
  recentAttempts,
  simulationsCompleted,
  totalXp,
}: ProgressOverviewProps) {
  const { currentLevelXp, percentage } = getLevelProgress(totalXp);

  return (
    <>
      <PageContainer className="space-y-6">
        <AppHeader eyebrow="TU AVANCE" title={`Progreso de ${fullName}`} />

        <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-strong)]">Nivel actual</p>
              <h1 className="mt-1 text-3xl font-bold">Nivel {level}</h1>
            </div>
            <Badge tone="warning">{totalXp} XP totales</Badge>
          </div>
          <ProgressBar
            className="mt-5"
            label={`${currentLevelXp} de ${XP_PER_LEVEL} XP para el nivel ${level + 1}`}
            value={percentage}
          />
        </Card>

        <section aria-label="Resumen de progreso" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <p className="text-sm text-[var(--muted)]">Simulaciones</p>
            <p className="mt-2 text-3xl font-bold text-[var(--brand-strong)]">{simulationsCompleted}</p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--muted)]">Precisión</p>
            <p className="mt-2 text-3xl font-bold text-[var(--brand-strong)]">{precision}%</p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--muted)]">Módulos</p>
            <p className="mt-2 text-3xl font-bold text-[var(--brand-strong)]">{completedModules}</p>
          </Card>
          <Card>
            <p className="text-sm text-[var(--muted)]">Insignias</p>
            <p className="mt-2 text-3xl font-bold text-[var(--brand-strong)]">{achievements.length}</p>
          </Card>
        </section>

        <section aria-labelledby="achievements-heading">
          <h2 className="text-xl font-bold" id="achievements-heading">Insignias</h2>
          {achievements.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {achievements.map((achievement) => (
                <Card className="border-amber-200 bg-amber-50" key={achievement.name}>
                  <Badge tone="warning">Desbloqueada</Badge>
                  <h3 className="mt-3 text-lg font-bold">{achievement.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{achievement.description}</p>
                  <p className="mt-3 text-xs font-semibold text-amber-900">
                    {dateFormatter.format(new Date(achievement.unlockedAt))}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-3 border-dashed bg-slate-50">
              <p className="font-bold">Tu primera insignia te espera</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Completa una simulación para desbloquearla.
              </p>
            </Card>
          )}
        </section>

        <section aria-labelledby="activity-heading">
          <h2 className="text-xl font-bold" id="activity-heading">Actividad reciente</h2>
          {recentAttempts.length > 0 ? (
            <div className="mt-3 space-y-3">
              {recentAttempts.map((attempt) => (
                <Card
                  className="flex items-center justify-between gap-4"
                  key={`${attempt.completedAt}-${attempt.title}`}
                >
                  <div>
                    <h3 className="font-bold">{attempt.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {dateFormatter.format(new Date(attempt.completedAt))}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-[var(--brand-strong)]">{attempt.score}%</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--muted)]">+{attempt.xpEarned} XP</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-3 border-dashed bg-slate-50">
              <p className="font-bold">Aún no tienes intentos guardados</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Tus resultados aparecerán aquí al terminar una simulación.
              </p>
            </Card>
          )}
        </section>
      </PageContainer>
      <BottomNavigation activeHref="/progreso" />
    </>
  );
}
