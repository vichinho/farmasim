import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: verifiedJwt } = await supabase.auth.getClaims();

  if (!verifiedJwt?.claims.sub) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
        <p className="text-sm font-bold tracking-[0.18em] text-[var(--brand)]">FARMA SIM</p>
        <h1 className="mt-3 text-3xl font-bold">Sesión iniciada</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          Tu cuenta está protegida y lista para el dashboard de capacitación.
        </p>
        <form action={logout} className="mt-7">
          <Button type="submit">Cerrar sesión</Button>
        </form>
      </section>
    </main>
  );
}
