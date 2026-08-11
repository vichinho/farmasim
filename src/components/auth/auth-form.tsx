"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  initialAuthFormState,
  type AuthFormState,
} from "@/features/auth/types";

type AuthAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

type AuthFormProps = {
  action: AuthAction;
  fields: "login" | "register" | "forgotPassword" | "resetPassword";
  next?: string;
  submitLabel: string;
};

const inputClassName =
  "min-h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-emerald-100";

export function AuthForm({ action, fields, next, submitLabel }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialAuthFormState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input name="next" type="hidden" value={next} /> : null}

      {fields === "register" ? (
        <label className="block space-y-1.5" htmlFor="fullName">
          <span className="text-sm font-medium">Nombre completo</span>
          <input
            autoComplete="name"
            className={inputClassName}
            id="fullName"
            name="fullName"
            required
          />
        </label>
      ) : null}

      {fields !== "resetPassword" ? (
        <label className="block space-y-1.5" htmlFor="email">
          <span className="text-sm font-medium">Correo electrónico</span>
          <input
            autoComplete="email"
            className={inputClassName}
            id="email"
            name="email"
            required
            type="email"
          />
        </label>
      ) : null}

      {fields === "login" || fields === "register" ? (
        <label className="block space-y-1.5" htmlFor="password">
          <span className="text-sm font-medium">Contraseña</span>
          <input
            autoComplete={fields === "login" ? "current-password" : "new-password"}
            className={inputClassName}
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
      ) : null}

      {fields === "resetPassword" ? (
        <>
          <label className="block space-y-1.5" htmlFor="password">
            <span className="text-sm font-medium">Nueva contraseña</span>
            <input
              autoComplete="new-password"
              className={inputClassName}
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <label className="block space-y-1.5" htmlFor="confirmation">
            <span className="text-sm font-medium">Confirmar contraseña</span>
            <input
              autoComplete="new-password"
              className={inputClassName}
              id="confirmation"
              minLength={8}
              name="confirmation"
              required
              type="password"
            />
          </label>
        </>
      ) : null}

      {state.error ? (
        <p aria-live="polite" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p aria-live="polite" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {state.success}
        </p>
      ) : null}

      <Button disabled={isPending} fullWidth size="lg" type="submit">
        {isPending ? "Procesando…" : submitLabel}
      </Button>
    </form>
  );
}
