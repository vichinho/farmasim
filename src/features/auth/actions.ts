"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { AuthFormState } from "./types";

function getRequiredText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function getSafeRedirectPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function login(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = getRequiredText(formData, "email");
  const password = getRequiredText(formData, "password");
  const next = getSafeRedirectPath(getRequiredText(formData, "next"));

  if (!isValidEmail(email) || !password) {
    return { error: "Ingresa un correo válido y tu contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "No fue posible iniciar sesión. Revisa tus datos e inténtalo otra vez." };
  }

  redirect(next);
}

export async function register(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = getRequiredText(formData, "fullName");
  const email = getRequiredText(formData, "email");
  const password = getRequiredText(formData, "password");
  const privacyAccepted = formData.get("privacyAccepted") === "on";

  if (!fullName || !isValidEmail(email) || password.length < 8 || !privacyAccepted) {
    return {
      error:
        "Ingresa tus datos, usa una contraseña de al menos 8 caracteres y confirma que leíste el aviso de privacidad.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { error: "No fue posible crear tu cuenta. Inténtalo otra vez." };
  }

  if (!data.session) {
    return { success: "Revisa tu correo para confirmar la cuenta antes de iniciar sesión." };
  }

  redirect("/dashboard");
}

export async function requestPasswordReset(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = getRequiredText(formData, "email");

  if (!isValidEmail(email)) {
    return { error: "Ingresa un correo válido." };
  }

  const origin = (await headers()).get("origin");
  if (!origin) {
    return { error: "No fue posible preparar el enlace de recuperación." };
  }

  const redirectTo = new URL("/auth/callback?next=/reset-password", origin).toString();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return { error: "No fue posible enviar el correo de recuperación." };
  }

  return { success: "Si el correo está registrado, recibirás un enlace de recuperación." };
}

export async function updatePassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = getRequiredText(formData, "password");
  const confirmation = getRequiredText(formData, "confirmation");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirmation) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Tu sesión de recuperación no es válida o expiró." };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

export async function closeOtherSessions() {
  const supabase = await createClient();
  const { data: verifiedJwt } = await supabase.auth.getClaims();

  if (!verifiedJwt?.claims.sub) {
    redirect("/login");
  }

  const { error } = await supabase.auth.signOut({ scope: "others" });
  redirect(error ? "/perfil?sessions=error" : "/perfil?sessions=closed");
}
