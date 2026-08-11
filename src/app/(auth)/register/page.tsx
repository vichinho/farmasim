import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { register } from "@/features/auth/actions";

export default function RegisterPage() {
  return (
    <AuthShell description="Crea tu cuenta para comenzar a practicar." title="Crea tu cuenta">
      <AuthForm action={register} fields="register" submitLabel="Crear cuenta" />
      <p className="mt-5 text-center text-sm text-[var(--muted)]">
        ¿Ya tienes cuenta?{" "}
        <Link className="font-semibold text-[var(--brand-strong)]" href="/login">
          Iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
