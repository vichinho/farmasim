import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacidad y datos personales | FarmaVerse",
  description: "Aviso de privacidad de la demostración FarmaVerse.",
};

const sections = [
  {
    title: "Datos que usa la demostración",
    body: "Nombre, correo electrónico administrado por Supabase, identificador interno de cuenta y resultados de aprendizaje como puntajes, progreso y logros. La contraseña no es visible para FarmaVerse: Supabase Auth la procesa mediante mecanismos de autenticación seguros.",
  },
  {
    title: "Finalidad",
    body: "Crear y proteger la cuenta, mantener la sesión, guardar avances y mostrar resultados personalizados. Los datos no se usan para diagnóstico, atención clínica ni decisiones laborales automatizadas.",
  },
  {
    title: "Datos que no debes ingresar",
    body: "No ingreses RUT, fichas clínicas, recetas reales, diagnósticos, datos biométricos ni información identificable de pacientes o compañeros. Todos los casos de entrenamiento son ficticios.",
  },
  {
    title: "Protección aplicada",
    body: "Conexiones cifradas mediante HTTPS en producción, autenticación gestionada por Supabase, aislamiento por usuario con Row Level Security, acceso mínimo a tablas, validación de tokens y respuestas autenticadas sin caché compartida.",
  },
  {
    title: "Conservación y derechos",
    body: "Antes de operar con usuarios reales se debe definir formalmente el plazo de conservación y un canal responsable para solicitudes de acceso, rectificación, supresión, oposición, bloqueo y portabilidad. Esta versión es un prototipo y no una certificación de cumplimiento legal.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link className="text-sm font-semibold text-[var(--brand-strong)] hover:underline" href="/">
        ← Volver a FarmaVerse
      </Link>

      <header className="mt-8 max-w-3xl">
        <Badge tone="brand">Versión 1 · 13 de agosto de 2026</Badge>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
          Privacidad y datos personales
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          Este aviso describe el tratamiento de datos de la demostración y las medidas adoptadas para preparar FarmaVerse para la Ley chilena 21.719, que entra en vigencia el 1 de diciembre de 2026.
        </p>
      </header>

      <div className="mt-8 grid gap-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <h2 className="text-xl font-bold">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{section.body}</p>
          </Card>
        ))}
      </div>

      <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Pendiente antes de producción: identificar formalmente al responsable del tratamiento, publicar un canal de contacto, fijar plazos de conservación y validar este aviso con asesoría jurídica chilena.
      </p>
    </main>
  );
}
