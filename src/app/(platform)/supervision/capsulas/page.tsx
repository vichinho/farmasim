import Link from "next/link";

import { assignCapsuleAction, createCapsuleAction, setCapsuleStatusAction } from "@/features/capsules/actions";
import { requireSupervisorContext } from "@/features/supervision/access";
import { competencyLabels } from "@/features/supervision/competency-analytics";
import { createExtendedClient } from "@/lib/supabase/server-untyped";

type FacilityRow = { id: string; display_name: string };
type CapsuleRow = {
  id: string;
  facility_id: string;
  title: string;
  summary: string | null;
  category: string;
  content_type: string;
  status: string;
  version: number;
  related_competency_ids: string[];
  updated_at: string;
};
type LearnerRow = { id: string; full_name: string };
type AssignmentRow = { capsule_id: string; status: string; user_id: string };

export default async function SupervisorCapsulesPage() {
  const context = await requireSupervisorContext();
  const supabase = await createExtendedClient();
  const [facilitiesResult, capsulesResult, learnersResult, assignmentsResult] = await Promise.all([
    supabase.from("establishments").select("id, display_name").order("display_name"),
    supabase.from("educational_capsules").select("id, facility_id, title, summary, category, content_type, status, version, related_competency_ids, updated_at").order("updated_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").eq("role", "learner").order("full_name"),
    supabase.from("capsule_assignments").select("capsule_id, status, user_id"),
  ]);

  const allFacilities = (facilitiesResult.data ?? []) as unknown as FacilityRow[];
  const facilities = context.role === "admin"
    ? allFacilities
    : allFacilities.filter((facility) => context.facilityIds.includes(facility.id));
  const capsules = (capsulesResult.data ?? []) as unknown as CapsuleRow[];
  const learners = (learnersResult.data ?? []) as unknown as LearnerRow[];
  const assignments = (assignmentsResult.data ?? []) as unknown as AssignmentRow[];
  const facilityNames = new Map(allFacilities.map((facility) => [facility.id, facility.display_name]));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link className="text-sm font-black text-violet-700" href="/supervision">← Volver al Panel de Supervisión</Link>
      <header className="mt-4 rounded-[2rem] border border-violet-100 bg-white p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.18em] text-violet-600">Capacitación</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Cápsulas educativas</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Crea, revisa, publica y asigna contenido. “Publicado” describe el estado dentro de FarmaVerse; no implica validación institucional formal.</p>
      </header>

      <section className="mt-6 rounded-[1.6rem] border border-violet-100 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-black">Crear cápsula</h2>
        {facilities.length ? (
          <form action={createCapsuleAction} className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-bold">Título<input className="mt-1 min-h-11 w-full rounded-xl border border-violet-100 px-3" maxLength={180} name="title" required /></label>
            <label className="text-sm font-bold">Establecimiento<select className="mt-1 min-h-11 w-full rounded-xl border border-violet-100 px-3" name="facilityId" required>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.display_name}</option>)}</select></label>
            <label className="text-sm font-bold">Resumen<input className="mt-1 min-h-11 w-full rounded-xl border border-violet-100 px-3" name="summary" /></label>
            <label className="text-sm font-bold">Categoría<input className="mt-1 min-h-11 w-full rounded-xl border border-violet-100 px-3" defaultValue="general" name="category" /></label>
            <label className="text-sm font-bold">Tipo<select className="mt-1 min-h-11 w-full rounded-xl border border-violet-100 px-3" name="contentType" required><option value="text">Texto breve</option><option value="image">Imagen</option><option value="pdf">PDF</option><option value="link">Enlace</option></select></label>
            <label className="text-sm font-bold">Archivo (imagen/PDF)<input accept="image/*,.pdf,application/pdf" className="mt-1 block min-h-11 w-full rounded-xl border border-violet-100 px-3 py-2" name="file" type="file" /></label>
            <label className="text-sm font-bold lg:col-span-2">Contenido<textarea className="mt-1 min-h-28 w-full rounded-xl border border-violet-100 p-3" name="content" /></label>
            <label className="text-sm font-bold lg:col-span-2">Enlace<input className="mt-1 min-h-11 w-full rounded-xl border border-violet-100 px-3" name="linkUrl" type="url" /></label>
            <fieldset className="lg:col-span-2"><legend className="text-sm font-bold">Competencias relacionadas</legend><div className="mt-2 flex flex-wrap gap-3">{Object.entries(competencyLabels).map(([id, label]) => <label className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold" key={id}><input name="relatedCompetencyIds" type="checkbox" value={id} />{label}</label>)}</div></fieldset>
            <label className="text-sm font-bold lg:col-span-2">IDs de medicamentos/presentaciones relacionados (separados por coma)<input className="mt-1 min-h-11 w-full rounded-xl border border-violet-100 px-3" name="relatedMedicationIds" placeholder="trakcare-004-0308, trakcare-004-0251" /></label>
            <button className="min-h-12 rounded-xl bg-violet-700 px-4 text-sm font-black text-white lg:col-span-2" type="submit">Crear como borrador</button>
          </form>
        ) : <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-900">No tienes establecimientos autorizados para crear contenido.</p>}
      </section>

      <section className="mt-6 space-y-4">
        {capsules.length ? capsules.map((capsule) => {
          const capsuleAssignments = assignments.filter((assignment) => assignment.capsule_id === capsule.id);
          return (
            <article className="rounded-[1.6rem] border border-violet-100 bg-white p-5 sm:p-6" key={capsule.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2 text-[.65rem] font-black uppercase"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">{capsule.status}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">v{capsule.version}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{capsule.content_type}</span></div>
                  <h2 className="mt-2 text-xl font-black">{capsule.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{facilityNames.get(capsule.facility_id) ?? capsule.facility_id} · {capsule.summary || "Sin resumen"}</p>
                  <p className="mt-2 text-xs text-slate-500">{capsuleAssignments.length} asignaciones · {capsuleAssignments.filter((assignment) => assignment.status === "completed").length} completadas</p>
                </div>
                <form action={setCapsuleStatusAction} className="flex flex-wrap gap-2">
                  <input name="capsuleId" type="hidden" value={capsule.id} />
                  <select className="min-h-10 rounded-lg border border-violet-100 px-2 text-xs font-bold" defaultValue={capsule.status} name="status"><option value="draft">Borrador</option><option value="reviewed">Revisado</option><option value="published">Publicado</option><option value="archived">Archivado</option></select>
                  <button className="rounded-lg border border-violet-200 px-3 text-xs font-black text-violet-700" type="submit">Actualizar estado</button>
                </form>
              </div>
              <form action={assignCapsuleAction} className="mt-4 grid gap-2 rounded-xl bg-violet-50/50 p-3 sm:grid-cols-[1fr_auto]">
                <input name="capsuleId" type="hidden" value={capsule.id} />
                <select className="min-h-10 rounded-lg border border-violet-100 bg-white px-3 text-sm" name="userId" required><option value="">Asignar a una TENS…</option>{learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.full_name || "TENS sin nombre"}</option>)}</select>
                <button className="rounded-lg bg-violet-700 px-4 text-xs font-black text-white" type="submit">Asignar cápsula</button>
              </form>
            </article>
          );
        }) : <div className="rounded-2xl border border-dashed border-violet-200 p-8 text-center text-sm text-slate-500">Aún no existen cápsulas visibles para tus establecimientos.</div>}
      </section>
    </main>
  );
}
