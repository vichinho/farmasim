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

function MetricCard({ label, value, detail, accentClass }: { label: string; value: number; detail: string; accentClass: string }) {
  return (
    <Card className="relative min-w-0 overflow-hidden border-[#0091AD]/15 bg-white p-4 sm:p-5">
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />
      <p className="text-[11px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-[#073642]">{value.toLocaleString("es-CL")}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
    </Card>
  );
}

export function AdminOverview({ metrics }: AdminOverviewProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#00788F]">Administración global</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073642] sm:text-4xl">Resumen de FarmaVerse</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Una vista ejecutiva para controlar usuarios, establecimientos, capacitación y actividad sin mezclar funciones operativas de TENS o Supervisor/QF.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#0091AD]/20 bg-[#6EFAFB]/35 px-3 py-2 text-xs font-black text-[#006D82]">
          <span className="h-2 w-2 rounded-full bg-[#0091AD]" />
          Plataforma operativa
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Indicadores principales">
        <MetricCard accentClass="bg-[#0091AD]" detail={`${metrics.learners} TENS · ${metrics.supervisors} supervisores · ${metrics.admins} admins`} label="Usuarios" value={metrics.users} />
        <MetricCard accentClass="bg-[#6EFAFB]" detail="Establecimientos activos" label="Red asistencial" value={metrics.establishments} />
        <MetricCard accentClass="bg-[#F7E8A4]" detail="Casos registrados en catálogo" label="Escenarios" value={metrics.scenarios} />
        <MetricCard accentClass="bg-[#FF57BB]" detail="Alertas de simulación registradas" label="Alertas" value={metrics.alerts} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,.75fr)]">
        <Card className="border-[#0091AD]/15 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#00788F]">Módulos</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[#073642]">Centro de administración</h2>
            </div>
            <span className="rounded-full bg-[#F7E8A4] px-3 py-1.5 text-xs font-black text-[#5E5318]">6 áreas</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {modules.map((module) => (
              <Link className="group rounded-2xl border border-[#0091AD]/12 bg-[#FFF4E4]/55 p-4 transition hover:-translate-y-0.5 hover:border-[#0091AD]/35 hover:bg-[#6EFAFB]/12 hover:shadow-[0_12px_30px_rgba(0,145,173,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0091AD]" href={module.href} key={module.href}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#00788F]/65">{module.meta}</p>
                    <h3 className="mt-1 text-base font-black text-[#073642]">{module.label}</h3>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#6EFAFB] text-sm font-black text-[#07566A] shadow-sm transition group-hover:bg-[#0091AD] group-hover:text-white">→</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{module.description}</p>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="relative overflow-hidden border-[#0091AD]/20 bg-[#FFF4E4] p-5 text-[#073642] shadow-[0_12px_34px_rgba(0,145,173,.08)] sm:p-6">
            <span aria-hidden="true" className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#6EFAFB]/35" />
            <span aria-hidden="true" className="absolute -bottom-10 right-14 h-24 w-24 rounded-full bg-[#FF57BB]/12" />
            <div className="relative">
              <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#00788F]">Actividad de entrenamiento</p>
              <p className="mt-4 text-4xl font-black text-[#0091AD]">{metrics.attempts.toLocaleString("es-CL")}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">intentos de simulación registrados</p>
              <div className="mt-5 border-t border-[#0091AD]/15 pt-4">
                <p className="text-2xl font-black text-[#B42B7A]">{metrics.publishedCapsules.toLocaleString("es-CL")}</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">cápsulas publicadas</p>
              </div>
            </div>
          </Card>

          <Card className="border-[#FF57BB]/20 bg-white p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#B42B7A]">Próximo bloque</p>
            <h2 className="mt-2 text-lg font-black text-[#073642]">Banco de escenarios</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">El módulo Escenarios queda preparado como destino administrativo para la incorporación progresiva del banco de 48 casos.</p>
            <Link className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[#FF57BB] px-4 text-sm font-black text-[#2A1021] transition hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(255,87,187,.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF57BB] focus-visible:ring-offset-2" href="/admin/escenarios">Ir a Escenarios <span className="ml-2">→</span></Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
