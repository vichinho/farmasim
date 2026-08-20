import Link from "next/link";
import { redirect } from "next/navigation";

import { openCapsuleAndRedirectAction } from "@/features/capsules/navigation-actions";
import { createExtendedClient } from "@/lib/supabase/server-untyped";

type AssignmentRow = { id: string; capsule_id: string; status: string; assigned_at: string };
type CapsuleRow = { id: string; title: string; summary: string | null; category: string; content_type: string; status: string };

export default async function CapsulesPage() {
  const supabase = await createExtendedClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/login");
  const [assignmentsResult, capsulesResult] = await Promise.all([
    supabase.from("capsule_assignments").select("id, capsule_id, status, assigned_at").eq("user_id", userId).order("assigned_at", { ascending: false }),
    supabase.from("educational_capsules").select("id, title, summary, category, content_type, status").eq("status", "published"),
  ]);
  const assignments = (assignmentsResult.data ?? []) as unknown as AssignmentRow[];
  const capsules = (capsulesResult.data ?? []) as unknown as CapsuleRow[];
  const capsuleMap = new Map(capsules.map((capsule) => [capsule.id, capsule]));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <nav className="mb-3 flex items-center justify-between sm:mb-4" aria-label="Navegación de cápsulas">
        <Link
          className="inline-flex min-h-10 items-center rounded-xl border border-violet-100 bg-white px-3 text-sm font-black text-violet-700 shadow-[0_5px_18px_rgba(76,48,130,.06)] transition hover:bg-violet-50"
          href="/dashboard"
        >
          ← Dashboard
        </Link>
      </nav>

      <header className="rounded-[1.5rem] border border-violet-100 bg-white p-5 sm:rounded-[2rem] sm:p-8">
        <p className="text-[.65rem] font-black uppercase tracking-[.18em] text-violet-600 sm:text-xs">Mi capacitación</p>
        <h1 className="mt-1.5 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">Cápsulas educativas</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Contenido asignado por tu Supervisor/QF. Abrir una cápsula no la marca como completada.</p>
      </header>
      <section className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2">
        {assignments.length ? assignments.map((assignment) => {
          const capsule = capsuleMap.get(assignment.capsule_id);
          if (!capsule) return null;
          return (
            <article className="rounded-[1.4rem] border border-violet-100 bg-white p-5" key={assignment.id}>
              <div className="flex flex-wrap gap-2 text-[.65rem] font-black uppercase"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">{assignment.status}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{capsule.content_type}</span></div>
              <h2 className="mt-3 text-lg font-black">{capsule.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{capsule.summary || "Cápsula de refuerzo asignada."}</p>
              <p className="mt-3 text-xs text-slate-400">Asignada {new Date(assignment.assigned_at).toLocaleDateString("es-CL")}</p>
              <form action={openCapsuleAndRedirectAction} className="mt-4"><input name="assignmentId" type="hidden" value={assignment.id} /><button className="min-h-11 w-full rounded-xl bg-violet-700 px-4 text-sm font-black text-white" type="submit">{assignment.status === "completed" ? "Revisar nuevamente" : "Abrir cápsula"}</button></form>
            </article>
          );
        }) : <div className="sm:col-span-2 rounded-2xl border border-dashed border-violet-200 p-8 text-center text-sm text-slate-500">No tienes cápsulas asignadas.</div>}
      </section>
    </main>
  );
}
