import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { countCompletedTrainingLevels, trainingLevels } from "@/data/training";
import { closeOtherSessions, logout } from "@/features/auth/actions";
import { ProfileOverview } from "@/features/profile/profile-overview";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Cuenta y seguridad | FarmaVerse",
  description: "Revisa tu cuenta y controla tus sesiones de FarmaVerse.",
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

  const [{ data: profile }, { data: attempts }, { sessions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, created_at, level, role, xp")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("simulation_attempts")
      .select("level_number")
      .eq("user_id", userId)
      .not("completed_at", "is", null),
    searchParams,
  ]);
  const issuedAt = verifiedJwt.claims.iat;
  const sessionStarted = typeof issuedAt === "number"
    ? new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(issuedAt * 1000),
      )
    : "Hora no disponible";
  const completedLevels = countCompletedTrainingLevels(
    (attempts ?? []).map((attempt) => attempt.level_number),
  );

  return (
    <>
      <ProfileOverview
        closeOtherSessionsAction={closeOtherSessions}
        completedLevels={completedLevels}
        email={maskEmail(verifiedJwt.claims.email)}
        fullName={profile?.full_name?.trim() || "Usuario"}
        level={profile?.level ?? 1}
        logoutAction={logout}
        role={profile?.role ?? "learner"}
        sessionStarted={sessionStarted}
        sessionsCompleted={(attempts ?? []).length}
        sessionsStatus={sessions}
        totalLevels={trainingLevels.length}
        totalXp={profile?.xp ?? 0}
      />
      <BottomNavigation activeHref="/perfil" />
    </>
  );
}
