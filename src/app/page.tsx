import Image from "next/image";
import Link from "next/link";

import { FarmaVerseIcon, FarmaVerseLogo } from "@/components/brand/farmaverse-logo";
import { Icon } from "@/components/ui/icon";

import styles from "./homepage.module.css";

const navItems = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#experiencia", label: "Experiencia" },
  { href: "#para-equipos", label: "Para equipos" },
];

const outcomes = [
  { icon: "book" as const, label: "Casos guiados" },
  { icon: "sparkles" as const, label: "Feedback inmediato" },
  { icon: "chart" as const, label: "Progreso visible" },
];

const benefits = [
  {
    description:
      "Entornos de farmacia que convierten situaciones cotidianas en decisiones concretas.",
    icon: "play" as const,
    title: "Simulaciones inmersivas",
  },
  {
    description:
      "Casos estructurados con contexto, orientación y feedback inmediato en cada paso.",
    icon: "book" as const,
    title: "Aprendizaje guiado",
  },
  {
    description:
      "Indicadores claros para reconocer avances, criterios reforzados y próximos desafíos.",
    icon: "chart" as const,
    title: "Progreso que se puede ver",
  },
];

const steps = [
  {
    description: "Revisa la información del caso y comprende el contexto del paciente.",
    number: "01",
    title: "Explora",
  },
  {
    description: "Toma decisiones en un entorno simulado y recibe feedback inmediato.",
    number: "02",
    title: "Practica",
  },
  {
    description: "Refuerza criterios y aplica lo aprendido en nuevos escenarios.",
    number: "03",
    title: "Mejora",
  },
];

const primaryLinkClass =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(8,127,91,0.22)] transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-[var(--brand-strong)] hover:shadow-[0_16px_34px_rgba(8,127,91,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";

const secondaryLinkClass =
  "group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white/80 px-5 text-sm font-bold text-[var(--brand-strong)] shadow-sm transition-[transform,background-color,border-color] duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 20 20">
      <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 20 20">
      <path d="M10 2.5 16 5v4.2c0 3.8-2.5 6.7-6 8.3-3.5-1.6-6-4.5-6-8.3V5l6-2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="m7.3 10 1.7 1.7 3.8-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function ProductPreview() {
  return (
    <div className={`${styles.previewEnter} relative mx-auto w-full max-w-[39rem] lg:ml-auto`}>
      <div className="absolute -inset-12 -z-10 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(16,33,62,0.16)]">
        <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="hidden size-8 place-items-center sm:grid">
            <FarmaVerseIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-[var(--foreground)]">
              <span>Caso 1 de 6</span>
              <span className="text-[var(--muted)]">17%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`${styles.progressFill} h-full rounded-full bg-[var(--brand)]`} />
            </div>
          </div>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <Image alt="Escena ficticia de una simulación de atención farmacéutica" className="object-cover transition-transform duration-700 hover:scale-[1.025]" fill loading="eager" sizes="(max-width: 1024px) 100vw, 620px" src="/images/farmasim/case001-scene.jpg" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,45,38,0.2)] via-transparent to-transparent" />

          {[
            { className: "left-[26%] top-[20%]", delay: "0s", label: "Paciente" },
            { className: "bottom-[23%] left-[54%]", delay: "0.7s", label: "Medicamento" },
            { className: "right-[12%] top-[29%]", delay: "1.4s", label: "Preparación" },
          ].map((hotspot, index) => (
            <span aria-label={hotspot.label} className={`${styles.hotspot} ${hotspot.className}`} key={hotspot.label} style={{ animationDelay: hotspot.delay }}>
              <span>{index + 1}</span>
            </span>
          ))}

          <div className={`${styles.patientCardEnter} absolute bottom-3 left-3 w-[min(63%,15rem)] rounded-2xl border border-white/70 bg-white p-3 shadow-xl sm:bottom-4 sm:left-4 sm:p-4`}>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--brand)] sm:text-[0.68rem]">Paciente virtual</p>
            <p className="mt-1 text-xs font-bold text-[var(--foreground)] sm:text-sm">María, 52 años</p>
            <p className="mt-1 hidden text-xs leading-5 text-[var(--muted)] sm:block">Consulta por cefalea y mareos ocasionales.</p>
          </div>

          <div className={`${styles.resultCardEnter} absolute bottom-4 right-3 rounded-2xl border border-white/80 bg-white px-3 py-2.5 shadow-xl sm:right-4 sm:px-4 sm:py-3`}>
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-amber-100 text-amber-700"><Icon className="size-4" name="sparkles" /></span>
              <div>
                <p className="text-[0.62rem] font-semibold text-[var(--muted)] sm:text-[0.68rem]">Criterio reforzado</p>
                <p className="text-sm font-black text-[var(--brand)] sm:text-base">+120 XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExperiencePreview() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(16,33,62,0.11)]">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-xs font-bold text-[var(--brand-strong)]">
        <span className="flex gap-1.5" aria-hidden="true"><i className="size-2 rounded-full bg-rose-300" /><i className="size-2 rounded-full bg-amber-300" /><i className="size-2 rounded-full bg-emerald-300" /></span>
        <span className="ml-2">Caso: Cefalea en paciente hipertensa</span>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-[0.72fr_1.28fr] sm:p-5">
        <div className="space-y-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Información del caso</p>
            {[["Paciente", true], ["Antecedentes", false], ["Medicamentos", false], ["Signos y síntomas", false]].map(([label, active]) => (
              <div className={`mt-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[0.68rem] font-semibold ${active ? "bg-emerald-100 text-[var(--brand-strong)]" : "text-[var(--muted)]"}`} key={String(label)}>
                <span className={`size-1.5 rounded-full ${active ? "bg-[var(--brand)]" : "bg-slate-300"}`} />{label}
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-100 p-3">
            <p className="text-[0.65rem] font-bold text-[var(--foreground)]">Tu progreso</p>
            <p className="mt-2 text-lg font-black text-[var(--foreground)]">3 <span className="text-xs text-[var(--muted)]">/ 12 criterios</span></p>
          </div>
        </div>
        <div>
          <div className="relative aspect-[16/7] overflow-hidden rounded-xl bg-slate-100"><Image alt="Vista del caso simulado" className="object-cover" fill sizes="(max-width: 640px) 100vw, 440px" src="/images/farmasim/case001-scene.jpg" /></div>
          <p className="mt-3 text-xs font-bold text-[var(--foreground)]">¿Cuál es tu siguiente paso?</p>
          <div className="mt-2 space-y-1.5">
            {["Confirmar adherencia al tratamiento", "Revisar interacciones relevantes", "Medir presión arterial"].map((answer, index) => (
              <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[0.66rem] ${index === 1 ? "border-emerald-300 bg-emerald-50 font-semibold text-[var(--brand-strong)]" : "border-slate-200 text-[var(--muted)]"}`} key={answer}>
                <span className={`size-2 rounded-full border ${index === 1 ? "border-[var(--brand)] bg-[var(--brand)]" : "border-slate-300"}`} />{answer}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
      <main className="overflow-hidden bg-[#f8faf9] text-[var(--foreground)]">
        <header className={`${styles.headerEnter} relative z-50 border-b border-white/70 bg-[#f8faf9]/90 backdrop-blur-xl`}>
          <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
            <Link aria-label="FarmaVerse, ir al inicio" href="#inicio"><FarmaVerseLogo className="w-40 sm:w-44" priority /></Link>
            <nav aria-label="Navegación principal" className="hidden items-center gap-7 lg:flex">
              {navItems.map((item) => <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand)]" href={item.href} key={item.href}>{item.label}</Link>)}
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link className="hidden rounded-lg px-3 py-2 text-sm font-bold text-[var(--foreground)] transition-colors hover:bg-white sm:inline-flex" href="/login">Ingresar</Link>
              <Link className={`${primaryLinkClass} min-h-10 px-3.5 sm:px-4`} href="/login">Probar demo</Link>
            </div>
          </div>
        </header>

        <section className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24" id="inicio">
          <div className={`${styles.heroGrid} pointer-events-none absolute inset-0 -z-10 opacity-60`} />
          <div className="absolute -left-48 top-16 -z-10 size-96 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className={`${styles.copyEnter} relative z-10`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-[var(--brand-strong)] shadow-sm"><span className="size-1.5 rounded-full bg-[var(--brand)]" />Entrenamiento clínico interactivo</div>
            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.08] tracking-[-0.045em] text-[var(--foreground)] sm:text-5xl lg:text-[3.55rem]">
              Decisiones más seguras comienzan con <span className="relative inline-block text-[var(--brand)]">práctica realista.<svg aria-hidden="true" className="absolute -bottom-2 left-0 h-2 w-full text-emerald-300/80" preserveAspectRatio="none" viewBox="0 0 200 8"><path className={styles.underlineDraw} d="M2 6C48 1 127 1 198 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" /></svg></span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">Entrena criterios de atención farmacéutica con casos interactivos, feedback inmediato y progreso medible.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className={primaryLinkClass} href="/login">Probar la demo<ArrowIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" /></Link>
              <Link className={secondaryLinkClass} href="#como-funciona"><span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-[var(--brand-strong)]"><Icon className="size-3.5" name="play" /></span>Ver cómo funciona</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-[var(--muted)]">
              {["Casos ficticios", "Entorno seguro", "Avance a tu ritmo"].map((item) => <span className="flex items-center gap-1.5" key={item}><span className="text-[var(--brand)]"><ShieldIcon /></span>{item}</span>)}
            </div>
          </div>
          <ProductPreview />
        </section>

        <section aria-label="Resultados de aprendizaje" className={`${styles.viewReveal} mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8`}>
          <div className="grid overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_50px_rgba(16,33,62,0.07)] lg:grid-cols-[1.25fr_repeat(3,1fr)]">
            <div className="flex items-center border-b border-slate-100 px-6 py-6 lg:border-b-0 lg:border-r"><p className="max-w-xs text-base font-bold leading-6 text-[var(--foreground)]">Diseñado para convertir conocimiento en decisiones</p></div>
            {outcomes.map((outcome) => <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 last:border-b-0 lg:justify-center lg:border-b-0 lg:border-r lg:last:border-r-0" key={outcome.label}><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-[var(--brand)]"><Icon className="size-5" name={outcome.icon} /></span><span className="text-sm font-semibold text-slate-600">{outcome.label}</span></div>)}
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white" id="como-funciona">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <div className={`${styles.viewReveal} mx-auto max-w-3xl text-center`}><p className="text-xs font-black uppercase tracking-[0.17em] text-[var(--brand)]">Una plataforma para avanzar</p><h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl lg:text-5xl">Practica, comprende y mejora con cada caso.</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">Cada experiencia combina contexto, decisión y feedback para convertir la teoría en un criterio que puedas reconocer y reforzar.</p></div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {benefits.map((benefit) => <article className={`${styles.viewReveal} group rounded-[1.5rem] border border-slate-200 bg-[#fbfdfc] p-6 shadow-[0_10px_34px_rgba(16,33,62,0.055)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-2 hover:border-emerald-200 hover:shadow-[0_20px_45px_rgba(16,33,62,0.1)]`} key={benefit.title}><div className="grid size-14 place-items-center rounded-2xl bg-emerald-100/70 text-[var(--brand)] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105"><Icon className="size-6" name={benefit.icon} /></div><h3 className="mt-6 text-xl font-black tracking-tight text-[var(--brand-strong)]">{benefit.title}</h3><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{benefit.description}</p></article>)}
            </div>
          </div>
        </section>

        <section className="relative" id="experiencia">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_45%,rgba(167,243,208,0.32),transparent_32%)]" />
          <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8 lg:py-28">
            <div className={styles.viewReveal}><p className="text-xs font-black uppercase tracking-[0.17em] text-[var(--brand)]">Una ruta clara</p><h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">De la teoría a la decisión, paso a paso.</h2><div className="relative mt-10 space-y-8"><div aria-hidden="true" className={`${styles.timelineGrow} absolute bottom-6 left-6 top-6 w-px origin-top bg-emerald-300`} />{steps.map((step) => <div className={`${styles.viewReveal} relative grid grid-cols-[3rem_1fr] gap-5`} key={step.number}><span className="relative z-10 grid size-12 place-items-center rounded-full border-4 border-[#f8faf9] bg-emerald-100 text-sm font-black text-[var(--brand)] shadow-sm">{step.number}</span><div className="pt-1"><h3 className="text-lg font-black text-[var(--foreground)]">{step.title}</h3><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{step.description}</p></div></div>)}</div></div>
            <div className={styles.viewReveal}><ExperiencePreview /></div>
          </div>
        </section>

        <section className="border-y border-emerald-900/10 bg-emerald-950 text-white" id="para-equipos">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
            <div className={styles.viewReveal}><p className="text-xs font-black uppercase tracking-[0.17em] text-emerald-300">Para equipos que quieren avanzar</p><h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">Una experiencia común para practicar criterios, conversar decisiones y reconocer el progreso.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/70">FarmaVerse propone un entorno demostrativo para complementar la capacitación sin reemplazar protocolos institucionales ni supervisión profesional.</p></div>
            <div className={`${styles.viewReveal} grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1`}>{["Casos estructurados", "Acceso multiplataforma", "Avance individual"].map((item) => <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-emerald-50" key={item}><span className="size-1.5 rounded-full bg-emerald-300" />{item}</div>)}</div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#13213c_0%,#13213c_58%,#0b3b35_100%)] px-6 py-12 text-white shadow-[0_30px_80px_rgba(16,33,62,0.22)] sm:px-12 sm:py-14 lg:px-16">
            <div className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative z-10 grid gap-10 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center lg:grid-cols-[minmax(0,1fr)_13rem]">
              <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.17em] text-emerald-300">Demo disponible</p><h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">Practica hoy. <span className="text-emerald-300">Decide mejor mañana.</span></h2><p className="mt-5 max-w-xl text-base leading-7 text-slate-300">Recorre casos ficticios de entrenamiento desde tu teléfono o computador y descubre una manera más activa de aprender.</p><Link className={`${primaryLinkClass} mt-8 bg-emerald-400 text-emerald-950 hover:bg-emerald-300`} href="/login">Entrar a FarmaVerse<ArrowIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" /></Link></div>
              <div className="relative hidden size-40 place-items-center justify-self-end sm:grid lg:size-52">
                <div className={`${styles.ctaOrbit} pointer-events-none absolute inset-0 rounded-full border border-emerald-300/20`} />
                <div className={`${styles.logoFloat} relative grid size-24 place-items-center lg:size-32`}>
                  <FarmaVerseIcon className="size-24 lg:size-32" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-[var(--muted)] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><FarmaVerseLogo className="w-40" /><div className="flex flex-wrap items-center gap-x-6 gap-y-3"><Link className="font-semibold transition-colors hover:text-[var(--brand-strong)]" href="/privacidad">Privacidad</Link><span aria-hidden="true" className="hidden text-slate-300 sm:inline">•</span><p>Contenido demostrativo para capacitación.</p></div></div></footer>
      </main>
  );
}
