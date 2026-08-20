import Link from "next/link";

import { Card } from "@/components/ui/card";

type AdminOverviewProps = {
  metrics: {
    admins: number;
    alerts: number;
    attempts: number;
    establishments: number;
    learners: number;
    publishedCapsules: number;
    scenarios: number;
    supervisors: number;
    users: number;
  };
};

type ModuleCard = {
  description: string;
  href: string;
  label: string;
  meta: string;
};

const modules: ModuleCard[] = [
  { href: "/admin/usuarios", label: "Usuarios", description: "Gestiona TENS, supervisores y administradores desde una vista global.", meta: "Identidades y roles" },
  { href: "/admin/establecimientos", label: "Establecimientos", description: "Revisa la red asistencial, membresías y alcance de cada equipo.", meta: "Organización" },
  { href: "/admin/escenarios", label: "Escenarios", description: "Administra el catálogo de simulaciones, estados y futura carga del banco de 48.", meta: "Capacitación" },
  { href: "/admin/capsulas", label: "Cápsulas", description: "Supervisa contenido educativo, publicación y asignaciones por establecimiento.", meta: "Contenido" },
  { href: "/admin/analitica", label: "Analítica", description: "Consolida actividad, avance, competencias y alertas del entrenamiento.", meta: "Indicadores" },
  { href: "/admin/auditoria", label: "Auditoría", description: "Consulta trazabilidad de acciones administrativas y eventos relevantes.", meta: "Gobernanza" },
];

function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <Card className="min-w-0 border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value.toLocaleString("es-CL")}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
    </Card>
  );
}

export function AdminOverview({ metrics }: AdminOverviewProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">Administración global</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Resumen de FarmaVerse</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Una vista ejecutiva para controlar usuarios, establecimientos, capacitación y actividad sin mezclar funciones operativas de TENS o Supervisor/QF.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Plataforma operativa
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Indicadores principales">
        <MetricCard detail={`${metrics.learners} TENS · ${metrics.supervisors} supervisores · ${metrics.admins} admins`} label="Usuarios" value={metrics.users} />
        <MetricCard detail="Establecimientos activos" label="Red asistencial" value={metrics.establishments} />
        <MetricCard detail="Casos registrados en catálogo" label="Escenarios" value={metrics.scenarios} />
        <MetricCard detail="Alertas de simulación registradas" label="Alertas" value={metrics.alerts} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,.75fr)]">
        <Card className="border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Módulos</p>
              <h2 className="mt-1 text-xl font-black tracking-tight">Centro de administración</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">6 áreas</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {modules.map((module) => (
              <Link className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/60 hover:shadow-[0_12px_30px_rgba(76,48,130,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" href={module.href} key={module.href}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">{module.meta}</p>
                    <h3 className="mt-1 text-base font-black text-slate-900">{module.label}</h3>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-sm font-black text-violet-600 shadow-sm transition group-hover:bg-violet-600 group-hover:text-white">→</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{module.description}</p>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-violet-200 bg-gradient-to-br from-violet-700 via-violet-700 to-indigo-800 p-5 text-white sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[.16em] text-violet-200">Actividad de entrenamiento</p>
            <p className="mt-4 text-4xl font-black">{metrics.attempts.toLocaleString("es-CL")}</p>
            <p className="mt-1 text-sm font-semibold text-violet-100">intentos de simulación registrados</p>
            <div className="mt-5 border-t border-white/15 pt-4">
              <p className="text-2xl font-black">{metrics.publishedCapsules.toLocaleString("es-CL")}</p>
              <p className="mt-1 text-xs font-semibold text-violet-200">cápsulas publicadas</p>
            </div>
          </Card>

          <Card className="border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">Próximo bloque</p>
            <h2 className="mt-2 text-lg font-black">Banco de escenarios</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">El módulo Escenarios queda preparado como destino administrativo para la incorporación progresiva del banco de 48 casos.</p>
            <Link className="mt-4 inline-flex min-h-10 items-center text-sm font-black text-violet-700" href="/admin/escenarios">Ir a Escenarios <span className="ml-2">→</span></Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
