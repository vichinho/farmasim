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
    <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">Panel de Supervisión</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Hola, {context.fullName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Seguimiento formativo de tu equipo. Estos datos corresponden a entrenamiento y alertas de simulación, no a incidentes clínicos reales.
            </p>
            <p className="mt-2 text-xs font-bold text-violet-700">
              Alcance: {facilityNames.length ? facilityNames.join(" · ") : "sin establecimientos asignados"}
            </p>
          </div>
          <Link className="rounded-xl bg-violet-700 px-4 py-3 text-sm font-black text-white" href="/supervision/capsulas">
            Gestionar cápsulas
          </Link>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="TENS activas" value={activeTens} />
        <Stat label="Casos realizados" value={attempts.length} />
        <Stat label="Casos completados" value={completedAttempts.length} note={`${percentage(completedAttempts.length, attempts.length)}% de los intentos visibles`} />
        <Stat label="Alertas de simulación interceptadas" value={alerts.filter((alert) => !alert.reached_patient).length} />
        <Stat label="Módulos completados" value={completedModules} />
        <Stat label="Cápsulas asignadas" value={assignments.length} />
        <Stat label="Cápsulas completadas" value={completedCapsules} note={`${percentage(completedCapsules, assignments.length)}% de asignaciones`} />
        <Stat label="Avance medio por módulo" value={`${progress.length ? Math.round(progress.reduce((sum, item) => sum + item.progress_percentage, 0) / progress.length) : 0}%`} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[1.6rem] border border-violet-100 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-violet-600">Equipo</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Progreso individual</h2>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">Sin rankings</span>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {profiles.length ? profiles.map((profile) => {
              const ownAttempts = attempts.filter((attempt) => attempt.user_id === profile.id);
              const ownProgress = progress.filter((item) => item.user_id === profile.id);
              const avg = ownProgress.length
                ? Math.round(ownProgress.reduce((sum, item) => sum + item.progress_percentage, 0) / ownProgress.length)
                : 0;
              return (
                <Link className="flex items-center justify-between gap-4 py-4 hover:text-violet-700" href={`/supervision/tens/${profile.id}`} key={profile.id}>
                  <div>
                    <p className="font-black">{profile.full_name || "TENS sin nombre"}</p>
                    <p className="mt-1 text-xs text-slate-500">{ownAttempts.length} sesiones · {avg}% avance medio</p>
                  </div>
                  <span className="text-sm font-black text-violet-700">Revisar →</span>
                </Link>
              );
            }) : <p className="py-8 text-sm text-slate-500">No hay TENS visibles en los establecimientos autorizados.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.6rem] border border-violet-100 bg-white p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-wider text-violet-600">Competencias</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-emerald-50 p-3"><p className="text-2xl font-black text-emerald-700">{competencyCounts.dominated ?? 0}</p><p className="text-[.7rem] font-bold text-emerald-800">Dominadas</p></div>
              <div className="rounded-xl bg-violet-50 p-3"><p className="text-2xl font-black text-violet-700">{competencyCounts["in-progress"] ?? 0}</p><p className="text-[.7rem] font-bold text-violet-800">En progreso</p></div>
              <div className="rounded-xl bg-amber-50 p-3"><p className="text-2xl font-black text-amber-700">{competencyCounts.reinforcement ?? 0}</p><p className="text-[.7rem] font-bold text-amber-800">En refuerzo</p></div>
            </div>
            <p className="mt-3 text-[.7rem] leading-5 text-slate-500">Regla FarmaVerse: dominada requiere dos evidencias satisfactorias consecutivas; no representa certificación institucional.</p>
          </section>
          <section className="rounded-[1.6rem] border border-violet-100 bg-white p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-wider text-violet-600">Patrones agregados</p>
            <dl className="mt-4 space-y-3 text-sm">
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
