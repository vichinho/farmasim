import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { closeOtherSessions, logout } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Cuenta y seguridad | FarmaSim",
  description: "Revisa tu cuenta y controla tus sesiones de FarmaSim.",
};

type ProfilePageProps = {
  searchParams: Promise<{ sessions?: string }>;
};

function maskEmail(value: unknown) {
  if (typeof value !== "string") return "Correo no disponible";
  const [name, domain] = value.split("@");
  if (!name || !domain) return "Correo no disponible";
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(name.length - 2, 6)))}@${domain}`;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createClient();
  const { data: verifiedJwt } = await supabase.auth.getClaims();
  const userId = verifiedJwt?.claims.sub;

  if (!userId) redirect("/login");

  const [{ data: profile }, { sessions }] = await Promise.all([
    supabase.from("profiles").select("full_name, created_at").eq("id", userId).maybeSingle(),
    searchParams,
  ]);
  const issuedAt = verifiedJwt.claims.iat;
  const sessionStarted = typeof issuedAt === "number"
    ? new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(issuedAt * 1000),
      )
    : "Hora no disponible";

  return (
    <>
      <PageContainer className="space-y-6">
        <header className="max-w-2xl">
          <Badge tone="brand">Cuenta protegida</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Perfil y sesiones</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">
            Revisa la sesión actual y cierra accesos abiertos en otros dispositivos si ya no los reconoces.
          </p>
        </header>

        {sessions === "closed" ? (
          <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900" role="status">
            Las demás sesiones fueron cerradas. Esta sesión sigue activa.
          </p>
        ) : null}
        {sessions === "error" ? (
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">
            No fue posible cerrar las otras sesiones. Inténtalo nuevamente.
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2" aria-label="Datos de la cuenta">
          <Card>
            <p className="text-sm font-semibold text-[var(--brand-strong)]">Cuenta</p>
            <h2 className="mt-2 text-xl font-bold">{profile?.full_name || "Usuario"}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{maskEmail(verifiedJwt.claims.email)}</p>
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
              FarmaSim no solicita RUT, fecha de nacimiento ni datos clínicos reales.
            </p>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/60">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--brand-strong)]">Sesión actual</p>
              <Badge tone="brand">Activa</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
              Token emitido: {sessionStarted}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              Por seguridad no mostramos identificadores de sesión ni tokens en pantalla.
            </p>
          </Card>
        </section>

        <Card>
          <h2 className="text-xl font-bold">Control de sesiones</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Supabase no expone al usuario un listado completo de dispositivos. Sí permite revocar todas las demás sesiones conservando esta.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <form action={closeOtherSessions}>
              <Button type="submit" variant="secondary">Cerrar otras sesiones</Button>
            </form>
            <form action={logout}>
              <Button type="submit" variant="ghost">Cerrar esta sesión</Button>
            </form>
          </div>
        </Card>

        <Card className="bg-slate-50">
          <h2 className="text-lg font-bold">Privacidad</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            La demostración conserva el nombre, correo administrado por Supabase y resultados de práctica asociados a tu cuenta.
          </p>
          <a className="mt-4 inline-flex font-semibold text-[var(--brand-strong)] hover:underline" href="/privacidad">
            Revisar el aviso de privacidad
          </a>
        </Card>
      </PageContainer>
      <BottomNavigation activeHref="/perfil" />
    </>
  );
}
