"use client";

import Link from "next/link";
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

const passwordHelp =
  "Mínimo 8 caracteres, con una mayúscula, una minúscula y un número.";

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
            aria-describedby={fields === "register" ? "password-help" : undefined}
            autoComplete={fields === "login" ? "current-password" : "new-password"}
            className={inputClassName}
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
          {fields === "register" ? (
            <span className="block text-xs leading-5 text-[var(--muted)]" id="password-help">
              {passwordHelp}
            </span>
          ) : null}
        </label>
      ) : null}

      {fields === "resetPassword" ? (
        <>
          <label className="block space-y-1.5" htmlFor="password">
            <span className="text-sm font-medium">Nueva contraseña</span>
            <input
              aria-describedby="password-help"
              autoComplete="new-password"
              className={inputClassName}
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
            <span className="block text-xs leading-5 text-[var(--muted)]" id="password-help">
              {passwordHelp}
            </span>
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

      {fields === "register" ? (
        <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-slate-50 p-3 text-sm leading-6">
          <input
            className="mt-1 size-4 shrink-0 accent-[var(--brand)]"
            name="privacyAccepted"
            required
            type="checkbox"
          />
          <span>
            He leído el{" "}
            <Link
              className="font-semibold text-[var(--brand-strong)] underline-offset-2 hover:underline"
              href="/privacidad"
              target="_blank"
            >
              aviso de privacidad
            </Link>{" "}
            y entiendo qué datos usa esta demostración.
          </span>
        </label>
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
