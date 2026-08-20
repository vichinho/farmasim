import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import {
  setPrimaryFacilityAction,
  updateAdminProfileAction,
  updateScenarioAction,
  updateTrainingModuleAction,
  upsertEstablishmentAction,
} from "@/features/admin/actions";
import { setCapsuleStatusAction } from "@/features/capsules/actions";
import { createExtendedClient } from "@/lib/supabase/server-untyped";

type Props = { params: Promise<{ section: string }> };
type ProfileRow = { id: string; full_name: string; role: "learner" | "supervisor" | "admin"; is_training_active: boolean; level: number; xp: number };
type FacilityRow = { id: string; display_name: string; is_active: boolean };
type MembershipRow = { user_id: string; facility_id: string; is_primary: boolean };
type ScenarioRow = { id: string; title: string; description: string; difficulty: number; xp_reward: number; is_active: boolean; slug: string | null; module_id: string };
type ModuleRow = { id: string; title: string; description: string; difficulty: number; xp_reward: number; is_active: boolean; sort_order: number };
type CapsuleRow = { id: string; title: string; status: string; facility_id: string; category: string; content_type: string; version: number; updated_at: string };
type AssignmentRow = { capsule_id: string; status: string };
type AttemptRow = { score: number; completed_at: string | null; user_id: string };
type AlertRow = { severity: string; reached_patient: boolean; detected_at: string };
type ProgressRow = { status: string; progress_percentage: number };
type AuditRow = { id: string; actor_id: string; facility_id: string | null; action: string; target_type: string; target_id: string; created_at: string };

const field = "min-h-11 rounded-xl border border-[#0091AD]/20 bg-white px-3 text-sm outline-none transition focus:border-[#0091AD] focus:ring-2 focus:ring-[#6EFAFB]/40";
const primaryButton = "min-h-11 rounded-xl bg-[#0091AD] px-4 text-sm font-black text-white transition hover:bg-[#00788F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0091AD] focus-visible:ring-offset-2";

function Header({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header><p className="text-xs font-black uppercase tracking-[.18em] text-[#00788F]">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#073642] sm:text-4xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p></header>;
}

function Badge({ children, tone = "cyan" }: { children: React.ReactNode; tone?: "cyan" | "pink" | "yellow" | "slate" }) {
  const classes = tone === "pink" ? "bg-[#FF57BB]/15 text-[#9A286B]" : tone === "yellow" ? "bg-[#F7E8A4] text-[#62561C]" : tone === "slate" ? "bg-slate-100 text-slate-600" : "bg-[#6EFAFB]/35 text-[#006D82]";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${classes}`}>{children}</span>;
}

async function UsersModule() {
  const supabase = await createExtendedClient();
  const [profilesResult, facilitiesResult, membershipsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, is_training_active, level, xp").order("full_name"),
    supabase.from("establishments").select("id, display_name, is_active").order("display_name"),
    supabase.from("profile_facility_memberships").select("user_id, facility_id, is_primary"),
  ]);
  const profiles = (profilesResult.data ?? []) as unknown as ProfileRow[];
  const facilities = (facilitiesResult.data ?? []) as unknown as FacilityRow[];
  const memberships = (membershipsResult.data ?? []) as unknown as MembershipRow[];
  const facilityNames = new Map(facilities.map((item) => [item.id, item.display_name]));

  return <div className="space-y-6"><Header eyebrow="Gestión de personas" title="Usuarios" description="Administra roles de cuenta, estado de capacitación y establecimiento principal sin mezclar estos permisos con TENS 1/TENS 2." />
    <div className="grid gap-4 xl:grid-cols-2">{profiles.map((profile) => {
      const primary = memberships.find((m) => m.user_id === profile.id && m.is_primary);
      return <Card className="border-[#0091AD]/15 bg-white p-5" key={profile.id}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-black text-[#073642]">{profile.full_name}</h2><p className="mt-1 text-xs text-slate-500">Nivel {profile.level} · {profile.xp} XP</p></div><div className="flex gap-2"><Badge>{profile.role}</Badge><Badge tone={profile.is_training_active ? "yellow" : "slate"}>{profile.is_training_active ? "activo" : "pausado"}</Badge></div></div>
        <form action={updateAdminProfileAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><input name="userId" type="hidden" value={profile.id} /><label className="text-xs font-bold text-slate-600">Rol<select className={`${field} mt-1 w-full`} defaultValue={profile.role} name="role"><option value="learner">TENS</option><option value="supervisor">Supervisor/QF</option><option value="admin">Admin</option></select></label><label className="flex min-h-11 items-center gap-2 text-xs font-bold text-slate-600"><input defaultChecked={profile.is_training_active} name="isTrainingActive" type="checkbox" />Capacitación activa</label><button className={primaryButton} type="submit">Guardar</button></form>
        <form action={setPrimaryFacilityAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"><input name="userId" type="hidden" value={profile.id} /><select className={field} defaultValue={primary?.facility_id ?? ""} name="facilityId" required><option value="">Establecimiento principal…</option>{facilities.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.display_name}</option>)}</select><button className="min-h-11 rounded-xl border border-[#0091AD]/25 px-4 text-sm font-black text-[#00788F]" type="submit">Asignar</button></form>
        <p className="mt-3 text-xs text-slate-500">Principal actual: {primary ? facilityNames.get(primary.facility_id) ?? primary.facility_id : "Sin asignar"}</p>
      </Card>;
    })}</div>
  </div>;
}

async function EstablishmentsModule() {
  const supabase = await createExtendedClient();
  const [facilitiesResult, membershipsResult] = await Promise.all([
    supabase.from("establishments").select("id, display_name, is_active").order("display_name"),
    supabase.from("profile_facility_memberships").select("user_id, facility_id, is_primary"),
  ]);
  const facilities = (facilitiesResult.data ?? []) as unknown as FacilityRow[];
  const memberships = (membershipsResult.data ?? []) as unknown as MembershipRow[];
  return <div className="space-y-6"><Header eyebrow="Organización" title="Establecimientos" description="Gestiona la red asistencial que estructura el alcance de TENS, supervisores, cápsulas y actividad." />
    <Card className="border-[#0091AD]/15 bg-white p-5"><h2 className="font-black text-[#073642]">Agregar establecimiento</h2><form action={upsertEstablishmentAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_1.5fr_auto_auto] md:items-end"><label className="text-xs font-bold">ID técnico<input className={`${field} mt-1 w-full`} name="id" pattern="[a-z0-9][a-z0-9-]{2,63}" placeholder="hospital-ejemplo" required /></label><label className="text-xs font-bold">Nombre<input className={`${field} mt-1 w-full`} name="displayName" required /></label><label className="flex min-h-11 items-center gap-2 text-xs font-bold"><input defaultChecked name="isActive" type="checkbox" />Activo</label><button className={primaryButton} type="submit">Crear</button></form></Card>
    <div className="grid gap-4 xl:grid-cols-2">{facilities.map((facility) => <Card className="border-[#0091AD]/15 bg-white p-5" key={facility.id}><div className="flex justify-between gap-3"><div><h2 className="font-black text-[#073642]">{facility.display_name}</h2><p className="mt-1 text-xs text-slate-500">{facility.id} · {memberships.filter((m) => m.facility_id === facility.id).length} membresías</p></div><Badge tone={facility.is_active ? "cyan" : "slate"}>{facility.is_active ? "Activo" : "Inactivo"}</Badge></div><form action={upsertEstablishmentAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><input name="id" type="hidden" value={facility.id} /><input className={field} defaultValue={facility.display_name} name="displayName" required /><label className="flex min-h-11 items-center gap-2 text-xs font-bold"><input defaultChecked={facility.is_active} name="isActive" type="checkbox" />Activo</label><button className={primaryButton} type="submit">Actualizar</button></form></Card>)}</div>
  </div>;
}

async function ScenariosModule() {
  const supabase = await createExtendedClient();
  const [scenariosResult, modulesResult] = await Promise.all([
    supabase.from("scenarios").select("id, title, description, difficulty, xp_reward, is_active, slug, module_id").order("title"),
    supabase.from("modules").select("id, title, description, difficulty, xp_reward, is_active, sort_order").order("sort_order"),
  ]);
  const scenarios = (scenariosResult.data ?? []) as unknown as ScenarioRow[];
  const modules = (modulesResult.data ?? []) as unknown as ModuleRow[];
  const moduleNames = new Map(modules.map((item) => [item.id, item.title]));
  return <div className="space-y-6"><Header eyebrow="Capacitación" title="Escenarios" description="Controla el catálogo registrado en Supabase. El contenido estructural del motor sigue versionado en código; aquí administras disponibilidad, dificultad y recompensa." />
    <div className="grid gap-4 xl:grid-cols-2">{scenarios.map((scenario) => <Card className="border-[#0091AD]/15 bg-white p-5" key={scenario.id}><div className="flex flex-wrap justify-between gap-3"><div><p className="text-[10px] font-black uppercase text-[#00788F]">{moduleNames.get(scenario.module_id) ?? "Módulo"}</p><h2 className="mt-1 font-black text-[#073642]">{scenario.title}</h2><p className="mt-1 text-xs text-slate-500">{scenario.slug ?? scenario.id}</p></div><Badge tone={scenario.is_active ? "cyan" : "slate"}>{scenario.is_active ? "Activo" : "Inactivo"}</Badge></div><form action={updateScenarioAction} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[7rem_8rem_auto_auto] sm:items-end"><input name="scenarioId" type="hidden" value={scenario.id} /><label className="text-xs font-bold">Dificultad<input className={`${field} mt-1 w-full`} defaultValue={scenario.difficulty} max={5} min={1} name="difficulty" type="number" /></label><label className="text-xs font-bold">XP<input className={`${field} mt-1 w-full`} defaultValue={scenario.xp_reward} max={5000} min={0} name="xpReward" type="number" /></label><label className="flex min-h-11 items-center gap-2 text-xs font-bold"><input defaultChecked={scenario.is_active} name="isActive" type="checkbox" />Activo</label><button className={primaryButton} type="submit">Guardar</button></form></Card>)}</div>
  </div>;
}

async function CapsulesModule() {
  const supabase = await createExtendedClient();
  const [capsulesResult, assignmentsResult, facilitiesResult] = await Promise.all([
    supabase.from("educational_capsules").select("id, title, status, facility_id, category, content_type, version, updated_at").order("updated_at", { ascending: false }),
    supabase.from("capsule_assignments").select("capsule_id, status"),
    supabase.from("establishments").select("id, display_name, is_active"),
  ]);
  const capsules = (capsulesResult.data ?? []) as unknown as CapsuleRow[];
  const assignments = (assignmentsResult.data ?? []) as unknown as AssignmentRow[];
  const facilities = (facilitiesResult.data ?? []) as unknown as FacilityRow[];
  const names = new Map(facilities.map((item) => [item.id, item.display_name]));
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><Header eyebrow="Contenido educativo" title="Cápsulas" description="Supervisa el catálogo global, estados y distribución por establecimiento." /><Link className={primaryButton} href="/supervision/capsulas">Gestión completa</Link></div>
    <div className="grid gap-4 xl:grid-cols-2">{capsules.map((capsule) => { const related = assignments.filter((item) => item.capsule_id === capsule.id); return <Card className="border-[#0091AD]/15 bg-white p-5" key={capsule.id}><div className="flex flex-wrap justify-between gap-3"><div><div className="flex gap-2"><Badge>{capsule.status}</Badge><Badge tone="yellow">v{capsule.version}</Badge></div><h2 className="mt-3 font-black text-[#073642]">{capsule.title}</h2><p className="mt-1 text-xs text-slate-500">{names.get(capsule.facility_id) ?? capsule.facility_id} · {capsule.category} · {capsule.content_type}</p><p className="mt-2 text-xs font-semibold text-slate-600">{related.length} asignaciones · {related.filter((item) => item.status === "completed").length} completadas</p></div></div><form action={setCapsuleStatusAction} className="mt-4 flex flex-wrap gap-2"><input name="capsuleId" type="hidden" value={capsule.id} /><select className={field} defaultValue={capsule.status} name="status"><option value="draft">Borrador</option><option value="reviewed">Revisado</option><option value="published">Publicado</option><option value="archived">Archivado</option></select><button className={primaryButton} type="submit">Actualizar estado</button></form></Card>; })}</div>
  </div>;
}

async function AnalyticsModule() {
  const supabase = await createExtendedClient();
  const [attemptsResult, alertsResult, progressResult, profilesResult] = await Promise.all([
    supabase.from("simulation_attempts").select("score, completed_at, user_id"),
    supabase.from("simulation_alerts").select("severity, reached_patient, detected_at"),
    supabase.from("user_module_progress").select("status, progress_percentage"),
    supabase.from("profiles").select("id, full_name, role, is_training_active, level, xp"),
  ]);
  const attempts = (attemptsResult.data ?? []) as unknown as AttemptRow[];
  const alerts = (alertsResult.data ?? []) as unknown as AlertRow[];
  const progress = (progressResult.data ?? []) as unknown as ProgressRow[];
  const profiles = (profilesResult.data ?? []) as unknown as ProfileRow[];
  const completedAttempts = attempts.filter((item) => item.completed_at);
  const avgScore = completedAttempts.length ? Math.round(completedAttempts.reduce((sum, item) => sum + item.score, 0) / completedAttempts.length) : 0;
  const avgProgress = progress.length ? Math.round(progress.reduce((sum, item) => sum + Number(item.progress_percentage), 0) / progress.length) : 0;
  const metrics = [["Intentos", attempts.length], ["Puntaje medio", `${avgScore}%`], ["Progreso medio", `${avgProgress}%`], ["Alertas", alerts.length], ["TENS activas", profiles.filter((item) => item.role === "learner" && item.is_training_active).length], ["Llegaron a paciente", alerts.filter((item) => item.reached_patient).length]];
  return <div className="space-y-6"><Header eyebrow="Inteligencia" title="Analítica" description="Indicadores agregados del entrenamiento. Son métricas pedagógicas de FarmaVerse, no indicadores clínicos institucionales." /><div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{metrics.map(([label, value]) => <Card className="border-[#0091AD]/15 bg-white p-5" key={String(label)}><p className="text-[10px] font-black uppercase tracking-wide text-[#00788F]">{label}</p><p className="mt-3 text-3xl font-black text-[#073642]">{value}</p></Card>)}</div><Card className="border-[#0091AD]/15 bg-white p-5"><h2 className="font-black text-[#073642]">Lectura de seguridad</h2><p className="mt-2 text-sm leading-6 text-slate-600">{alerts.filter((item) => !item.reached_patient).length} alertas fueron interceptadas antes del paciente. {alerts.filter((item) => item.severity === "high").length} están clasificadas con severidad alta dentro del modelo de simulación.</p></Card></div>;
}

async function AuditModule() {
  const supabase = await createExtendedClient();
  const [auditResult, profilesResult, facilitiesResult] = await Promise.all([
    supabase.from("supervisor_audit_log").select("id, actor_id, facility_id, action, target_type, target_id, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("profiles").select("id, full_name, role, is_training_active, level, xp"),
    supabase.from("establishments").select("id, display_name, is_active"),
  ]);
  const rows = (auditResult.data ?? []) as unknown as AuditRow[];
  const profiles = (profilesResult.data ?? []) as unknown as ProfileRow[];
  const facilities = (facilitiesResult.data ?? []) as unknown as FacilityRow[];
  const people = new Map(profiles.map((item) => [item.id, item.full_name])); const names = new Map(facilities.map((item) => [item.id, item.display_name]));
  return <div className="space-y-6"><Header eyebrow="Gobernanza" title="Auditoría" description="Últimas 100 acciones administrativas y de supervisión registradas para trazabilidad." /><div className="space-y-3">{rows.map((row) => <Card className="border-[#0091AD]/15 bg-white p-4" key={row.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-[#073642]">{row.action}</p><p className="mt-1 text-xs text-slate-500">{people.get(row.actor_id) ?? row.actor_id} · {row.target_type}: {row.target_id}</p><p className="mt-1 text-xs text-slate-500">{row.facility_id ? names.get(row.facility_id) ?? row.facility_id : "Alcance global"}</p></div><time className="text-xs font-semibold text-slate-500">{new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(new Date(row.created_at))}</time></div></Card>)}</div></div>;
}

async function SettingsModule() {
  const supabase = await createExtendedClient();
  const modulesResult = await supabase.from("modules").select("id, title, description, difficulty, xp_reward, is_active, sort_order").order("sort_order");
  const modules = (modulesResult.data ?? []) as unknown as ModuleRow[];
  return <div className="space-y-6"><Header eyebrow="Sistema" title="Configuración" description="Parámetros reales del catálogo de capacitación. Los cambios se registran en auditoría." /><div className="grid gap-4 xl:grid-cols-2">{modules.map((trainingModule) => <Card className="border-[#0091AD]/15 bg-white p-5" key={trainingModule.id}><div className="flex justify-between gap-3"><div><p className="text-[10px] font-black uppercase text-[#00788F]">Orden {trainingModule.sort_order} · dificultad {trainingModule.difficulty}</p><h2 className="mt-1 font-black text-[#073642]">{trainingModule.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{trainingModule.description}</p></div><Badge tone={trainingModule.is_active ? "cyan" : "slate"}>{trainingModule.is_active ? "Activo" : "Inactivo"}</Badge></div><form action={updateTrainingModuleAction} className="mt-4 grid gap-3 sm:grid-cols-[8rem_auto_auto] sm:items-end"><input name="moduleId" type="hidden" value={trainingModule.id} /><label className="text-xs font-bold">XP<input className={`${field} mt-1 w-full`} defaultValue={trainingModule.xp_reward} min={0} max={5000} name="xpReward" type="number" /></label><label className="flex min-h-11 items-center gap-2 text-xs font-bold"><input defaultChecked={trainingModule.is_active} name="isActive" type="checkbox" />Activo</label><button className={primaryButton} type="submit">Guardar</button></form></Card>)}</div></div>;
}

export default async function AdminSectionPage({ params }: Props) {
  const { section } = await params;
  if (section === "usuarios") return <UsersModule />;
  if (section === "establecimientos") return <EstablishmentsModule />;
  if (section === "escenarios") return <ScenariosModule />;
  if (section === "capsulas") return <CapsulesModule />;
  if (section === "analitica") return <AnalyticsModule />;
  if (section === "auditoria") return <AuditModule />;
  if (section === "configuracion") return <SettingsModule />;
  notFound();
}
