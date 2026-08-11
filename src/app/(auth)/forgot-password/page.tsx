import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { requestPasswordReset } from "@/features/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <AuthShell description="Te enviaremos un enlace para restablecer tu contraseña." title="Recuperar acceso">
      <AuthForm action={requestPasswordReset} fields="forgotPassword" submitLabel="Enviar enlace" />
      <p className="mt-5 text-center text-sm">
        <Link className="font-semibold text-[var(--brand-strong)]" href="/login">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
