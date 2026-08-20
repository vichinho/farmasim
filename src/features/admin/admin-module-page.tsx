import Link from "next/link";

import { Card } from "@/components/ui/card";

type AdminModulePageProps = {
  description: string;
  eyebrow: string;
  nextSteps: string[];
  title: string;
};

export function AdminModulePage({ description, eyebrow, nextSteps, title }: AdminModulePageProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <section>
        <p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">{description}</p>
      </section>

      <Card className="overflow-hidden border-slate-200 bg-white p-0">
        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-violet-600">Base del módulo lista</p>
              <h2 className="mt-1 text-xl font-black">Estructura administrativa preparada</h2>
            </div>
            <span className="w-fit rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-black text-violet-700">Fase 1</span>
          </div>
        </div>
        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="p-5 sm:p-6">
            <p className="text-sm leading-7 text-slate-600">Este módulo ya forma parte de la navegación Admin y está protegido por rol. La siguiente iteración incorporará sus acciones y datos específicos sin modificar la experiencia TENS ni Supervisor/QF.</p>
            <Link className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2" href="/admin">Volver al resumen</Link>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/70 p-5 md:border-l md:border-t-0 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">Próximas capacidades</p>
            <ul className="mt-4 space-y-3">
              {nextSteps.map((step) => (
                <li className="flex gap-3 text-sm font-semibold leading-6 text-slate-600" key={step}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
