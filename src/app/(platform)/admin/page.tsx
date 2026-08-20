import { AdminOverview } from "@/features/admin/admin-overview";
import { createExtendedClient } from "@/lib/supabase/server-untyped";

export default async function AdminPage() {
  const supabase = await createExtendedClient();

  const [
    users,
    learners,
    supervisors,
    admins,
    establishments,
    scenarios,
    attempts,
    publishedCapsules,
    alerts,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "learner"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "supervisor"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("establishments").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("scenarios").select("id", { count: "exact", head: true }),
    supabase.from("simulation_attempts").select("id", { count: "exact", head: true }),
    supabase.from("educational_capsules").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("simulation_alerts").select("id", { count: "exact", head: true }),
  ]);

  return (
    <AdminOverview
      metrics={{
        admins: admins.count ?? 0,
        alerts: alerts.count ?? 0,
        attempts: attempts.count ?? 0,
        establishments: establishments.count ?? 0,
        learners: learners.count ?? 0,
        publishedCapsules: publishedCapsules.count ?? 0,
        scenarios: scenarios.count ?? 0,
        supervisors: supervisors.count ?? 0,
        users: users.count ?? 0,
      }}
    />
  );
}
