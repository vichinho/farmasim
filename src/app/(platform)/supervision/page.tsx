import Link from "next/link";

import { summarizeCompetencies, type AttemptCompetencySource } from "@/features/supervision/competency-analytics";
import { requireSupervisorContext } from "@/features/supervision/access";
import { createExtendedClient } from "@/lib/supabase/server-untyped";
import type { Json } from "@/types/database";

type ProfileRow = {
  id: string;
  full_name: string;
  is_training_active: boolean;
  role: string;
};
type AttemptRow = {
  id: string;
  user_id: string;
  completed_at: string | null;
  criterion_results: Json;
};
type ProgressRow = { user_id: string; status: string; progress_percentage: number };
type AssignmentRow = { user_id: string; status: string };
type AlertRow = { user_id: string; kind: string; origin_stage: string; reached_patient: boolean };
type FacilityRow = { id: string; display_name: string };

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_10px_35px_rgba(76,48,130,.07)]">
      <p className="text-xs font-black uppercase tracking-[.12em] text-violet-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      {note ? <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p> : null}
    </div>
  );
}

function CompactStat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-3.5 shadow-[0_8px_24px_rgba(76,48,130,.06)]">
      <p className="text-[.62rem] font-black uppercase leading-4 tracking-[.08em] text-violet-600">{label}</p>
      <p className="mt-1 text-2xl font-black leading-none text-slate-950">{value}</p>
      {note ? <p className="mt-1.5 text-[.65rem] leading-4 text-slate-500">{note}</p> : null}
    </div>
  );
}

export default async function SupervisionPage() {
  const context = await requireSupervisorContext();
  const supabase = await createExtendedClient();
  const [profilesResult, attemptsResult, progressResult, assignmentsResult, alertsResult, facilitiesResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, is_training_active, role").eq("role", "learner"),
    supabase.from("simulation_attempts").select("id, user_id, completed_at, criterion_results").order("completed_at", { ascending: false }),
    supabase.from("user_module_progress").select("user_id, status, progress_percentage"),
    supabase.from("capsule_assignments").select("user_id, status"),
    supabase.from("simulation_alerts").select("user_id, kind, origin_stage, reached_patient"),
    supabase.from("establishments").select("id, display_name"),
  ]);

  const profiles = (profilesResult.data ?? []) as unknown as ProfileRow[];
  const attempts = (attemptsResult.data ?? []) as unknown as AttemptRow[];
  const progress = (progressResult.data ?? []) as unknown as ProgressRow[];
  const assignments = (assignmentsResult.data ?? []) as unknown as AssignmentRow[];
  const alerts = (alertsResult.data ?? []) as unknown as AlertRow[];
  const facilities = (facilitiesResult.data ?? []) as unknown as FacilityRow[];
  const completedAttempts = attempts.filter((attempt) => attempt.completed_at);
  const completedModules = progress.filter((item) => item.status === "completed").length;
  const completedCapsules = assignments.filter((item) => item.status === "completed").length;
  const activeTens = profiles.filter((profile) => profile.is_training_active).length;
  const interceptedAlerts = alerts.filter((alert) => !alert.reached_patient).length;
  const averageProgress = progress.length
    ? Math.round(progress.reduce((sum, item) => sum + item.progress_percentage, 0) / progress.length)
    : 0;

  const learnerCompetencies = profiles.flatMap((profile) => {
    const ownAttempts: AttemptCompetencySource[] = attempts
      .filter((attempt) => attempt.user_id === profile.id)
      .map((attempt) => ({ completedAt: attempt.completed_at, criterionResults: attempt.criterion_results }));
    return summarizeCompetencies(ownAttempts);
  });
  const competencyCounts = learnerCompetencies.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  const stageCounts = alerts.reduce((counts, alert) => {
    counts.set(alert.origin_stage, (counts.get(alert.origin_stage) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const kindCounts = alerts.reduce((counts, alert) => {
    counts.set(alert.kind, (counts.get(alert.kind) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const frequentStage = [...stageCounts.entries()].toSorted((a, b) => b[1] - a[1])[0]?.[0] ?? "Sin datos";
  const frequentKind = [...kindCounts.entries()].toSorted((a, b) => b[1] - a[1])[0]?.[0] ?? "Sin datos";
  const facilityNames = facilities
    .filter((facility) => context.facilityIds.includes(facility.id) || context.role === "admin")
    .map((facility) => facility.display_name);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <header className="rounded-[1.5rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-4 sm:rounded-[2rem] sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[.65rem] font-black uppercase tracking-[.18em] text-violet-600 sm:text-xs">Panel de Supervisión</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">Hola, {context.fullName}</h1>
            <p className="mt-1.5 text-xs font-bold text-violet-700 sm:mt-2">
              {facilityNames.length ? facilityNames.join(" · ") : "Sin establecimientos asignados"}
            </p>
          </div>
          <Link className="shrink-0 rounded-xl bg-violet-700 px-3 py-2.5 text-xs font-black text-white sm:px-4 sm:py-3 sm:text-sm" href="/supervision/capsulas">
            Cápsulas
          </Link>
        </div>
        <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-slate-600 sm:block">
          Seguimiento formativo de tu equipo. Estos datos corresponden a entrenamiento y alertas de simulación, no a incidentes clínicos reales.
        </p>
        <p className="mt-2 text-[.68rem] leading-5 text-slate-500 sm:hidden">Seguimiento de entrenamiento y alertas de simulación; no corresponde a incidentes clínicos reales.</p>
      </header>

      <section className="mt-4 sm:hidden" aria-label="Resumen de supervisión">
        <div className="grid grid-cols-2 gap-2.5">
          <CompactStat label="TENS activas" value={activeTens} />
          <CompactStat label="Casos realizados" value={attempts.length} />
          <CompactStat label="Alertas interceptadas" value={interceptedAlerts} />
          <CompactStat label="Avance medio" value={`${averageProgress}%`} />
        </div>
        <details className="mt-2.5 rounded-2xl border border-violet-100 bg-white shadow-[0_8px_24px_rgba(76,48,130,.05)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-violet-700 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-3"><span>Ver más métricas</span><span aria-hidden="true">＋</span></span>
          </summary>
          <div className="grid grid-cols-2 gap-2.5 border-t border-violet-50 p-3">
            <CompactStat label="Casos completados" value={completedAttempts.length} note={`${percentage(completedAttempts.length, attempts.length)}%`} />
            <CompactStat label="Módulos completados" value={completedModules} />
            <CompactStat label="Cápsulas asignadas" value={assignments.length} />
            <CompactStat label="Cápsulas completadas" value={completedCapsules} note={`${percentage(completedCapsules, assignments.length)}%`} />
          </div>
        </details>
      </section>

      <section className="mt-6 hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="TENS activas" value={activeTens} />
        <Stat label="Casos realizados" value={attempts.length} />
        <Stat label="Casos completados" value={completedAttempts.length} note={`${percentage(completedAttempts.length, attempts.length)}% de los intentos visibles`} />
        <Stat label="Alertas de simulación interceptadas" value={interceptedAlerts} />
        <Stat label="Módulos completados" value={completedModules} />
        <Stat label="Cápsulas asignadas" value={assignments.length} />
        <Stat label="Cápsulas completadas" value={completedCapsules} note={`${percentage(completedCapsules, assignments.length)}% de asignaciones`} />
        <Stat label="Avance medio por módulo" value={`${averageProgress}%`} />
      </section>

      <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[1.4rem] border border-violet-100 bg-white p-4 sm:rounded-[1.6rem] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[.65rem] font-black uppercase tracking-wider text-violet-600 sm:text-xs">Equipo</p>
              <h2 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">Progreso individual</h2>
            </div>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[.62rem] font-black text-violet-700 sm:px-3 sm:py-1.5 sm:text-xs">Sin rankings</span>
          </div>
          <div className="mt-3 divide-y divide-slate-100 sm:mt-4">
            {profiles.length ? profiles.map((profile) => {
              const ownAttempts = attempts.filter((attempt) => attempt.user_id === profile.id);
              const ownProgress = progress.filter((item) => item.user_id === profile.id);
              const avg = ownProgress.length
                ? Math.round(ownProgress.reduce((sum, item) => sum + item.progress_percentage, 0) / ownProgress.length)
                : 0;
              return (
                <Link className="flex items-center justify-between gap-3 py-3.5 hover:text-violet-700 sm:gap-4 sm:py-4" href={`/supervision/tens/${profile.id}`} key={profile.id}>
                  <div className="min-w-0">
                    <p className="truncate font-black">{profile.full_name || "TENS sin nombre"}</p>
                    <p className="mt-1 text-[.68rem] text-slate-500 sm:text-xs">{ownAttempts.length} sesiones · {avg}% avance medio</p>
                  </div>
                  <span className="shrink-0 text-xs font-black text-violet-700 sm:text-sm">Revisar →</span>
                </Link>
              );
            }) : <p className="py-8 text-sm text-slate-500">No hay TENS visibles en los establecimientos autorizados.</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6">
          <section className="rounded-[1.4rem] border border-violet-100 bg-white p-4 sm:rounded-[1.6rem] sm:p-6">
            <p className="text-[.65rem] font-black uppercase tracking-wider text-violet-600 sm:text-xs">Competencias</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:mt-4 sm:gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 sm:p-3"><p className="text-xl font-black text-emerald-700 sm:text-2xl">{competencyCounts.dominated ?? 0}</p><p className="text-[.6rem] font-bold text-emerald-800 sm:text-[.7rem]">Dominadas</p></div>
              <div className="rounded-xl bg-violet-50 p-2.5 sm:p-3"><p className="text-xl font-black text-violet-700 sm:text-2xl">{competencyCounts["in-progress"] ?? 0}</p><p className="text-[.6rem] font-bold text-violet-800 sm:text-[.7rem]">En progreso</p></div>
              <div className="rounded-xl bg-amber-50 p-2.5 sm:p-3"><p className="text-xl font-black text-amber-700 sm:text-2xl">{competencyCounts.reinforcement ?? 0}</p><p className="text-[.6rem] font-bold text-amber-800 sm:text-[.7rem]">En refuerzo</p></div>
            </div>
            <p className="mt-2.5 text-[.64rem] leading-4 text-slate-500 sm:mt-3 sm:text-[.7rem] sm:leading-5">Dominada requiere dos evidencias satisfactorias consecutivas; no representa certificación institucional.</p>
          </section>
          <section className="rounded-[1.4rem] border border-violet-100 bg-white p-4 sm:rounded-[1.6rem] sm:p-6">
            <p className="text-[.65rem] font-black uppercase tracking-wider text-violet-600 sm:text-xs">Patrones agregados</p>
            <dl className="mt-3 space-y-2.5 text-xs sm:mt-4 sm:space-y-3 sm:text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Etapa con más discrepancias</dt><dd className="font-black text-right">{frequentStage}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Tipo más frecuente</dt><dd className="font-black text-right">{frequentKind}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Alertas alcanzaron paciente</dt><dd className="font-black text-right">{alerts.filter((alert) => alert.reached_patient).length}</dd></div>
            </dl>
          </section>
        </div>
      </section>
    </main>
  );
}
