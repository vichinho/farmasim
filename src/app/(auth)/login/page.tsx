import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { login } from "@/features/auth/actions";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <AuthShell description="Ingresa para continuar con tu capacitación." title="Bienvenido de vuelta">
      <AuthForm action={login} fields="login" next={safeNext} submitLabel="Iniciar sesión" />
      <div className="mt-5 flex flex-col gap-3 text-center text-sm">
        <Link className="font-medium text-[var(--brand-strong)]" href="/forgot-password">
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-[var(--muted)]">
          ¿Aún no tienes cuenta?{" "}
          <Link className="font-semibold text-[var(--brand-strong)]" href="/register">
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
