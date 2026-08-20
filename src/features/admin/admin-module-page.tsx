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
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#00788F]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073642] sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
      </section>

      <Card className="overflow-hidden border-[#0091AD]/15 bg-white p-0">
        <div className="border-b border-[#0091AD]/10 bg-gradient-to-r from-[#6EFAFB]/18 via-[#FFF4E4]/80 to-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#00788F]">Base del módulo lista</p>
              <h2 className="mt-1 text-xl font-black text-[#073642]">Estructura administrativa preparada</h2>
            </div>
            <span className="w-fit rounded-full border border-[#0091AD]/20 bg-[#F7E8A4] px-3 py-1.5 text-xs font-black text-[#5E5318]">Fase 1</span>
          </div>
        </div>
        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="p-5 sm:p-6">
            <p className="text-sm leading-7 text-slate-600">Este módulo ya forma parte de la navegación Admin y está protegido por rol. La siguiente iteración incorporará sus acciones y datos específicos sin modificar la experiencia TENS ni Supervisor/QF.</p>
            <Link className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#0091AD] px-4 text-sm font-black text-white transition hover:bg-[#00788F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0091AD] focus-visible:ring-offset-2" href="/admin">Volver al resumen</Link>
          </div>
          <div className="border-t border-[#0091AD]/10 bg-[#FFF4E4]/55 p-5 md:border-l md:border-t-0 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#00788F]/65">Próximas capacidades</p>
            <ul className="mt-4 space-y-3">
              {nextSteps.map((step, index) => (
                <li className="flex gap-3 text-sm font-semibold leading-6 text-slate-600" key={step}>
                  <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${index % 2 === 0 ? "bg-[#FF57BB]" : "bg-[#0091AD]"}`} />
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
