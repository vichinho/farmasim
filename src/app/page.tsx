import Link from "next/link";

import { FarmaVerseLogo } from "@/components/brand/farmaverse-logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

const benefits = [
  {
    description:
      "Escenarios breves para practicar decisiones en un ambiente seguro y demostrativo.",
    icon: "play" as const,
    title: "Simula con propósito",
  },
  {
    description:
      "Cápsulas claras y concentradas para avanzar paso a paso antes de practicar.",
    icon: "book" as const,
    title: "Aprende a tu ritmo",
  },
  {
    description:
      "Feedback y progreso visual para reconocer avances y próximos desafíos.",
    icon: "chart" as const,
    title: "Sigue tu avance",
  },
];

const steps = [
  {
    description: "Elige una cápsula o un escenario ficticio de práctica.",
    number: "01",
    title: "Explora",
  },
  {
    description: "Conversa con pacientes virtuales y toma decisiones.",
    number: "02",
    title: "Practica",
  },
  {
    description: "Recibe feedback inmediato y observa tu progreso.",
    number: "03",
    title: "Avanza",
  },
];

const primaryLinkClass =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--brand)] px-5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";

const secondaryLinkClass =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-5 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link aria-label="FarmaVerse, ir al inicio" href="#inicio">
          <FarmaVerseLogo className="w-44 sm:w-48" priority />
        </Link>
        <Link
          className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-[var(--brand-strong)] transition-colors hover:bg-emerald-100"
          href="/login"
        >
          Ingresar
        </Link>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-20 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-28" id="inicio">
        <div className="relative z-10">
          <Badge tone="warning">Capacitación interactiva</Badge>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            Aprende. Practica. <span className="text-[var(--brand)]">Simula.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
            FarmaVerse transforma situaciones cotidianas en experiencias breves de
            aprendizaje. Practica decisiones con escenarios ficticios antes de
            enfrentarte a ellas en el trabajo.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className={primaryLinkClass} href="/login">
              Entrar a la demo
            </Link>
            <Link className={secondaryLinkClass} href="#como-funciona">
              Cómo funciona
            </Link>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Contenido demostrativo. No reemplaza protocolos institucionales,
            normativa sanitaria ni supervisión profesional.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
          <div className="absolute -inset-10 -z-10 rounded-full bg-emerald-100/70 blur-3xl" />
          <Card className="relative overflow-hidden border-emerald-100 p-0 shadow-[0_24px_60px_rgb(19_33_60/0.12)]">
            <div className="flex items-center justify-between bg-[var(--brand)] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-white/15 text-sm font-bold">
                  PV
                </span>
                <div>
                  <p className="text-sm font-semibold">Paciente virtual</p>
                  <p className="text-xs text-emerald-100">Escenario demostrativo</p>
                </div>
              </div>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                1 de 4
              </span>
            </div>
            <div className="space-y-5 p-5 sm:p-7">
              <p className="max-w-sm rounded-2xl rounded-tl-sm bg-[var(--surface-muted)] p-4 text-base leading-7 text-[var(--foreground)]">
                “Hola, necesito ayuda con un medicamento.”
              </p>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                ¿Cómo comenzarías la atención?
              </p>
              <div className="space-y-3">
                <div className="rounded-xl border-2 border-[var(--brand)] bg-emerald-50 px-4 py-3 text-sm font-semibold text-[var(--brand-strong)]">
                  Saludar y solicitar más información
                </div>
                <div className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
                  Buscar un producto inmediatamente
                </div>
                <div className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
                  Ignorar la consulta
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                Feedback inmediato y XP al finalizar
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-white" id="beneficios">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge tone="brand">Diseñado para avanzar</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Una práctica que se entiende desde el primer momento
            </h2>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="min-h-60">
                <div className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-[var(--brand-strong)]">
                  <Icon className="size-6" name={benefit.icon} />
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-[var(--foreground)]">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8" id="como-funciona">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <Badge tone="neutral">Simple y guiado</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Una ruta clara para practicar
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">
              Cada experiencia está pensada para que sepas qué hacer, por qué lo
              haces y cómo seguir avanzando.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <li
                className="rounded-3xl border border-[var(--border)] bg-white p-5"
                key={step.number}
              >
                <p className="text-sm font-bold tracking-wider text-[var(--brand)]">
                  {step.number}
                </p>
                <h3 className="mt-6 text-lg font-bold text-[var(--foreground)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[var(--foreground)] px-6 py-10 text-white sm:px-10 sm:py-12">
          <Badge className="bg-white/15 text-white" tone="neutral">
            Demo disponible
          </Badge>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            La práctica empieza con una decisión.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Inicia sesión y recorre los casos ficticios de entrenamiento desde
            cualquier teléfono o computador.
          </p>
          <Link
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href="/login"
          >
            Iniciar sesión
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-7 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <FarmaVerseLogo className="w-36" />
          <div className="flex flex-col gap-2 sm:items-end">
            <p>
              Prototipo de capacitación y simulación con contenido completamente
              demostrativo.
            </p>
            <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href="/privacidad">
              Privacidad y datos personales
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
