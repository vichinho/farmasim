import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { completeCapsuleAction } from "@/features/capsules/actions";
import { createExtendedClient } from "@/lib/supabase/server-untyped";

type Props = { params: Promise<{ assignmentId: string }> };
type AssignmentRow = { id: string; capsule_id: string; status: string; assigned_at: string; opened_at: string | null; completed_at: string | null };
type CapsuleRow = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  content: string | null;
  content_type: string;
  image_path: string | null;
  pdf_path: string | null;
  link_url: string | null;
  related_competency_ids: string[];
  status: string;
  version: number;
};

export default async function CapsuleDetailPage({ params }: Props) {
  const { assignmentId } = await params;
  const supabase = await createExtendedClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/login");
  const assignmentResult = await supabase.from("capsule_assignments").select("id, capsule_id, status, assigned_at, opened_at, completed_at").eq("id", assignmentId).eq("user_id", userId).maybeSingle();
  const assignment = assignmentResult.data as unknown as AssignmentRow | null;
  if (!assignment) notFound();
  const capsuleResult = await supabase.from("educational_capsules").select("id, title, summary, category, content, content_type, image_path, pdf_path, link_url, related_competency_ids, status, version").eq("id", assignment.capsule_id).eq("status", "published").maybeSingle();
  const capsule = capsuleResult.data as unknown as CapsuleRow | null;
  if (!capsule) notFound();

  const mediaPath = capsule.image_path ?? capsule.pdf_path;
  const signed = mediaPath
    ? await supabase.storage.from("educational-capsules").createSignedUrl(mediaPath, 300)
    : null;
  const signedUrl = signed?.data?.signedUrl ?? null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link className="text-sm font-black text-violet-700" href="/capsulas">← Volver a mis cápsulas</Link>
      <article className="mt-4 overflow-hidden rounded-[2rem] border border-violet-100 bg-white">
        <header className="border-b border-violet-100 bg-violet-50/40 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2 text-[.65rem] font-black uppercase"><span className="rounded-full bg-white px-2.5 py-1 text-violet-700">{capsule.category}</span><span className="rounded-full bg-white px-2.5 py-1 text-slate-600">v{capsule.version}</span><span className="rounded-full bg-white px-2.5 py-1 text-slate-600">{assignment.status}</span></div>
          <h1 className="mt-3 text-3xl font-black text-slate-950">{capsule.title}</h1>
          {capsule.summary ? <p className="mt-2 text-sm leading-6 text-slate-600">{capsule.summary}</p> : null}
        </header>
        <div className="space-y-5 p-6 sm:p-8">
          {capsule.content ? <div className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">{capsule.content}</div> : null}
          {capsule.content_type === "image" && signedUrl ? <object aria-label={`Recurso de la cápsula ${capsule.title}`} className="min-h-80 max-h-[32rem] w-full rounded-2xl object-contain" data={signedUrl} type="image/*">No se pudo mostrar la imagen.</object> : null}
          {capsule.content_type === "pdf" && signedUrl ? <a className="block rounded-xl border border-violet-200 p-4 text-sm font-black text-violet-700" href={signedUrl} rel="noreferrer" target="_blank">Abrir PDF asignado ↗</a> : null}
          {capsule.content_type === "link" && capsule.link_url ? <a className="block rounded-xl border border-violet-200 p-4 text-sm font-black text-violet-700" href={capsule.link_url} rel="noreferrer" target="_blank">Abrir recurso externo ↗</a> : null}
          {capsule.related_competency_ids.length ? <div className="rounded-xl border border-violet-100 p-4"><p className="text-xs font-black uppercase tracking-wider text-violet-600">Relacionado con</p><p className="mt-2 text-sm text-slate-600">{capsule.related_competency_ids.join(" · ")}</p></div> : null}
          <div className="rounded-xl bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-900">La cápsula complementa el entrenamiento. Marcarla como completada no sustituye el nuevo caso práctico de refuerzo.</div>
          {assignment.status !== "completed" ? <form action={completeCapsuleAction}><input name="assignmentId" type="hidden" value={assignment.id} /><button className="min-h-12 w-full rounded-xl bg-violet-700 px-4 text-sm font-black text-white" type="submit">Marcar cápsula como completada</button></form> : <div className="rounded-xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">Cápsula completada.</div>}
        </div>
      </article>
    </main>
  );
}
