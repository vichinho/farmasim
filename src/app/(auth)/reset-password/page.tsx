import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { updatePassword } from "@/features/auth/actions";

export default function ResetPasswordPage() {
  return (
    <AuthShell description="Elige una contraseña nueva de al menos 8 caracteres." title="Nueva contraseña">
      <AuthForm action={updatePassword} fields="resetPassword" submitLabel="Actualizar contraseña" />
    </AuthShell>
  );
}
