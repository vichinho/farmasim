import Link from "next/link";
import { notFound } from "next/navigation";

import { summarizeCompetencies, type AttemptCompetencySource } from "@/features/supervision/competency-analytics";
import { requireSupervisorContext } from "@/features/supervision/access";
import { presentSimulationAlert } from "@/features/supervision/simulation-alert-presentation";
import { createExtendedClient } from "@/lib/supabase/server-untyped";
import type { Json } from "@/types/database";

type Props = { params: Promise<{ userId: string }> };
type ProfileRow = { id: string; full_name: string; is_training_active: boolean };
type AttemptRow = {
  id: string;
  completed_at: string | null;
  correct_answers: number;
  incorrect_answers: number;
  criterion_results: Json;
  level_number: number | null;
  scenario_id: string;
  score: number;
  started_at: string;
};
type ProgressRow = { module_id: string; progress_percentage: number; status: string };
type ModuleRow = { id: string; title: string };
type AssignmentRow = { id: string; status: string; capsule_id: string; assigned_at: string };
type CapsuleRow = { id: string; title: string };
type AlertRow = {
  id: string;
  category: string;
  kind: string;
  origin_stage: string;
  severity: string;
  detected_at: string;
  reached_patient: boolean;
  metadata: Json;
};

const statusLabel = {
  dominated: "DOMINADA",
  "in-progress": "EN PROGRESO",
  reinforcement: "EN REFUERZO",
  "not-started": "SIN EVIDENCIA",
} as const;

export default async function TensProgressPage({ params }: Props) {
  await requireSupervisorContext();
  const { userId } = await params;
  const supabase = await createExtendedClient();
  const [profileResult, attemptsResult, progressResult, modulesResult, assignmentsResult, capsulesResult, alertsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, is_training_active").eq("id", userId).eq("role", "learner").maybeSingle(),
    supabase.from("simulation_attempts").select("id, completed_at, correct_answers, incorrect_answers, criterion_results, level_number, scenario_id, score, started_at").eq("user_id", userId).order("started_at", { ascending: false }).limit(20),
    supabase.from("user_module_progress").select("module_id, progress_percentage, status").eq("user_id", userId),
    supabase.from("modules").select("id, title"),
    supabase.from("capsule_assignments").select("id, status, capsule_id, assigned_at").eq("user_id", userId).order("assigned_at", { ascending: false }),
    supabase.from("educational_capsules").select("id, title"),
    supabase.from("simulation_alerts").select("id, category, kind, origin_stage, severity, detected_at, reached_patient, metadata").eq("user_id", userId).order("detected_at", { ascending: false }).limit(20),
  ]);

  const profile = profileResult.data as unknown as ProfileRow | null;
  if (!profile) notFound();
  const attempts = (attemptsResult.data ?? []) as unknown as AttemptRow[];
  const progress = (progressResult.data ?? []) as unknown as ProgressRow[];
  const modules = (modulesResult.data ?? []) as unknown as ModuleRow[];
  const assignments = (assignmentsResult.data ?? []) as unknown as AssignmentRow[];
  const capsules = (capsulesResult.data ?? []) as unknown as CapsuleRow[];
  const alerts = (alertsResult.data ?? []) as unknown as AlertRow[];
  const moduleNames = new Map(modules.map((module) => [module.id, module.title]));
  const capsuleNames = new Map(capsules.map((capsule) => [capsule.id, capsule.title]));
  const competencies = summarizeCompetencies(attempts.map<AttemptCompetencySource>((attempt) => ({
    completedAt: attempt.completed_at,
    criterionResults: attempt.criterion_results,
  })));
  const completedCases = attempts.filter((attempt) => attempt.completed_at).length;
  const completedCapsules = assignments.filter((assignment) => assignment.status === "completed").length;
  const pendingCapsules = assignments.filter((assignment) => assignment.status !== "completed").length;
  const averageProgress = progress.length
    ? Math.round(progress.reduce((sum, item) => sum + item.progress_percentage, 0) / progress.length)
    : 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link className="text-sm font-black text-violet-700" href="/supervision">← Volver al Panel de Supervisión</Link>
      <header className="mt-4 rounded-[2rem] border border-violet-100 bg-white p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">Progreso individual</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950">{profile.full_name || "TENS sin nombre"}</h1>
            <p className="mt-2 text-sm text-slate-500">{profile.is_training_active ? "Capacitación activa" : "Capacitación pausada"} · {attempts.length} sesiones registradas</p>
          </div>
          <div className="rounded-2xl bg-violet-50 px-5 py-3 text-right">
            <p className="text-xs font-black uppercase text-violet-600">Avance medio</p>
            <p className="text-2xl font-black text-violet-800">{averageProgress}%</p>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Casos completados" value={completedCases} />
        <Metric label="Módulos completados" value={progress.filter((item) => item.status === "completed").length} />
        <Metric label="Cápsulas pendientes" value={pendingCapsules} />
        <Metric label="Cápsulas completadas" value={completedCapsules} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Competencias">
          <div className="space-y-2">
            {competencies.map((competency) => (
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3" key={competency.id}>
                <span className="text-sm font-bold">{competency.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-[.65rem] font-black ${competency.status === "dominated" ? "bg-emerald-100 text-emerald-800" : competency.status === "reinforcement" ? "bg-amber-100 text-amber-900" : "bg-violet-100 text-violet-800"}`}>
                  {statusLabel[competency.status]}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[.7rem] leading-5 text-slate-500">La categoría “dominada” es una regla interna de entrenamiento FarmaVerse, no una certificación clínica o institucional.</p>
        </Panel>

        <Panel title="Módulos">
          <div className="space-y-3">
            {progress.length ? progress.map((item) => (
              <div key={item.module_id}>
                <div className="flex justify-between gap-3 text-sm"><span className="font-bold">{moduleNames.get(item.module_id) ?? "Módulo"}</span><span className="font-black">{item.progress_percentage}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-violet-50"><div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.min(100, Math.max(0, item.progress_percentage))}%` }} /></div>
              </div>
            )) : <p className="text-sm text-slate-500">Sin módulos iniciados.</p>}
          </div>
        </Panel>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Últimas sesiones">
          <div className="space-y-2">
            {attempts.length ? attempts.slice(0, 8).map((attempt) => (
              <div className="rounded-xl border border-slate-100 p-3" key={attempt.id}>
                <div className="flex justify-between gap-3"><p className="text-sm font-black">{attempt.scenario_id}</p><span className="text-xs font-bold text-violet-700">{attempt.score}%</span></div>
                <p className="mt-1 text-xs text-slate-500">Nivel {attempt.level_number ?? "—"} · {attempt.completed_at ? "Completado" : "En curso"} · {new Date(attempt.started_at).toLocaleDateString("es-CL")}</p>
              </div>
            )) : <p className="text-sm text-slate-500">Sin sesiones.</p>}
          </div>
        </Panel>

        <Panel title="Alertas de simulación interceptadas">
          <div className="space-y-2">
            {alerts.length ? alerts.map((alert) => {
              const presentation = presentSimulationAlert({
                category: alert.category,
                kind: alert.kind,
                metadata: alert.metadata,
                originStage: alert.origin_stage,
                severity: alert.severity,
              });
              return (
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3" key={alert.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{presentation.title}</p>
                      <p className="mt-1 text-[.7rem] font-bold text-amber-800">{presentation.categoryLabel} · Severidad {presentation.severityLabel}</p>
                    </div>
                    <span className="text-right text-[.65rem] font-black uppercase text-amber-800">{presentation.originLabel}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{new Date(alert.detected_at).toLocaleString("es-CL")} · {alert.reached_patient ? "Revisar barrera de seguridad" : "Interceptada antes del paciente simulado"}</p>
                </div>
              );
            }) : <p className="text-sm text-slate-500">Sin alertas de simulación registradas.</p>}
          </div>
        </Panel>
      </section>

      <section className="mt-6">
        <Panel title="Cápsulas educativas">
          <div className="grid gap-3 sm:grid-cols-2">
            {assignments.length ? assignments.map((assignment) => (
              <div className="rounded-xl border border-violet-100 p-4" key={assignment.id}>
                <p className="font-black">{capsuleNames.get(assignment.capsule_id) ?? "Cápsula"}</p>
                <p className="mt-1 text-xs text-slate-500">Estado: {assignment.status} · Asignada {new Date(assignment.assigned_at).toLocaleDateString("es-CL")}</p>
              </div>
            )) : <p className="text-sm text-slate-500">Sin cápsulas asignadas.</p>}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-violet-100 bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-violet-600">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[1.6rem] border border-violet-100 bg-white p-5 sm:p-6"><h2 className="text-lg font-black text-slate-950">{title}</h2><div className="mt-4">{children}</div></section>;
}
