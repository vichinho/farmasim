"use client";

import { useRef, useState } from "react";

import { saveSimulationAttempt, type SaveSimulationAttemptResult } from "@/features/progress/actions";
import type { TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = { levelNumber: number; mode: TrainingMode; trainingCase: TrainingCase };
type Field = "code" | "name" | "state" | "observation";

export function ContextualStorageExperience({ levelNumber, mode, trainingCase }: Props) {
  const [selected, setSelected] = useState(false);
  const [reviewed, setReviewed] = useState<Field[]>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveSimulationAttemptResult | null>(null);
  const attemptId = useRef(crypto.randomUUID());
  const startedAt = useRef(new Date().toISOString());
  const progress = Math.max(10, Math.round((reviewed.length / 4) * 100));
  const completionSaved = saveResult?.status === "saved" || saveResult?.status === "duplicate";

  function review(field: Field) {
    setReviewed((current) => Array.from(new Set([...current, field])));
  }

  async function finish() {
    setFinished(true);
    setSaving(true);
    const correctAnswers = reviewed.length;
    const result = await saveSimulationAttempt({
      attemptId: attemptId.current,
      correctAnswers,
      incorrectAnswers: 4 - correctAnswers,
      levelNumber,
      scenarioSlug: trainingCase.id,
      startedAt: startedAt.current,
    });
    setSaveResult(result);
    setSaving(false);
  }

  function restart() {
    setSelected(false); setReviewed([]); setFinished(false); setSaveResult(null); attemptId.current = crypto.randomUUID(); startedAt.current = new Date().toISOString();
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-violet-100 bg-white shadow-[0_22px_70px_rgba(76,48,130,.13)]">
      <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(18rem,32rem)_auto] lg:items-center">
        <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white">+</div><div><p className="text-xl font-black tracking-tight text-violet-800">FarmaSim</p><p className="text-xs font-semibold text-slate-500">Simulaciones · Caso 005</p></div></div>
        <div><div className="mb-2 flex justify-between text-xs font-black text-slate-700"><span>Progreso del caso</span><span>{finished ? 100 : progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${finished ? 100 : progress}%` }} /></div></div>
        <div className="flex justify-end gap-2"><span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ {mode.shortLabel}</span><span className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black">{trainingCase.context.timeLabel}</span></div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_27.5rem]">
        <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
          <div className="relative min-h-[720px] overflow-hidden bg-[#e9e8ec]">
            <div className="absolute inset-0 overflow-hidden bg-[#e9e8ec]">
              <img alt="Área ficticia de almacenamiento de farmacia" className="absolute inset-0 h-full w-full scale-[1.08] object-cover object-[72%_43%]" draggable={false} src="/images/farmasim/case001-scene.jpg" />
              <div className="pointer-events-none absolute inset-0 bg-slate-950/10" />
              {!finished ? <button aria-label="Revisar zona de almacenamiento" className="case001-scene-hotspot group absolute left-[72%] top-[25%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl outline-none transition focus-visible:ring-4 focus-visible:ring-violet-300/60" data-hotspot-id="storage" onClick={() => setSelected(true)} type="button"><span className="case001-scene-hotspot-dot mx-auto block size-3.5 rounded-full border-[3px] border-white bg-violet-600/90 shadow-lg transition group-hover:scale-125" /><span className={`case001-scene-hotspot-label pointer-events-none mt-2 block rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-violet-700 shadow transition ${mode.guidance === "guided" ? "opacity-100" : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>Zona de almacenamiento</span></button> : null}
            </div>

            <div className="absolute bottom-5 left-5 z-30 w-[min(92%,27rem)]"><div className="max-h-[390px] overflow-auto rounded-[1.2rem] border border-violet-100 bg-white/96 p-5 shadow-[0_16px_42px_rgba(17,24,39,.13)] backdrop-blur-xl">
              {finished ? <div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Resultados</p><h2 className="mt-2 text-2xl font-black">Revisión finalizada</h2><div className="mt-4 grid gap-2">{(["code","name","state","observation"] as Field[]).map((field) => <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2" key={field}><span className="text-sm font-semibold">{field === "code" ? "Código" : field === "name" ? "Nombre" : field === "state" ? "Estado de almacenamiento" : "Observación"}</span><span className={reviewed.includes(field) ? "rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700" : "rounded-md bg-rose-50 px-2 py-1 text-xs font-black text-rose-700"}>{reviewed.includes(field) ? "Revisado" : "Omitido"}</span></div>)}</div>{saving ? <p className="mt-3 text-xs text-slate-500">Guardando progreso…</p> : saveResult?.status === "error" ? <p className="mt-3 text-xs font-bold text-rose-600">{saveResult.message}</p> : completionSaved ? <p className="mt-3 text-xs font-bold text-emerald-700">Caso completado y progreso actualizado.</p> : null}{completionSaved ? <a className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-violet-700 px-4 text-center font-bold text-white shadow-sm hover:bg-violet-800" href="/simulaciones/case-006-multiple-errors?nivel=6">Pasar al siguiente caso</a> : null}<button className="mt-3 min-h-11 w-full rounded-xl border border-violet-200 font-bold text-violet-700" onClick={restart}>Repetir caso</button></div> : selected ? <div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Registro diario</p><h2 className="mt-2 text-xl font-black">Producto ficticio F-102</h2><p className="mt-2 text-sm text-slate-600">Inspecciona la información disponible y completa la revisión cuando consideres suficiente.</p><div className="mt-4 grid grid-cols-2 gap-2"><button className="rounded-xl border border-violet-200 p-3 text-left text-sm font-bold" onClick={() => review("code")}>Código<br /><span className="font-normal text-slate-500">F-102</span></button><button className="rounded-xl border border-violet-200 p-3 text-left text-sm font-bold" onClick={() => review("name")}>Nombre<br /><span className="font-normal text-slate-500">Producto farmacológico ficticio</span></button><button className="rounded-xl border border-violet-200 p-3 text-left text-sm font-bold" onClick={() => review("state")}>Estado<br /><span className="font-normal text-slate-500">Almacenamiento visible</span></button><button className="rounded-xl border border-violet-200 p-3 text-left text-sm font-bold" onClick={() => review("observation")}>Observación<br /><span className="font-normal text-slate-500">Registrar hallazgo</span></button></div><button className="mt-4 min-h-11 w-full rounded-xl bg-violet-700 px-4 font-bold text-white" onClick={finish}>Cerrar revisión</button></div> : <div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Revisión interna</p><h2 className="mt-2 text-2xl font-black">Inicio de revisión</h2><p className="mt-2 text-sm text-slate-600">Explora el área de almacenamiento y completa la revisión diaria con la información disponible.</p></div>}
            </div></div>
          </div>
        </div>

        <aside className="space-y-4 bg-[#fcfcfe] p-5">
          {!finished ? <><div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">Misión</p><p className="mt-2 font-bold text-slate-900">Realiza la revisión interna del almacenamiento de forma completa y segura.</p></div><div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"><h3 className="font-black">Información disponible</h3><p className="mt-3 text-sm text-slate-500">Solo se mostrará información obtenida al interactuar con el área.</p></div></> : null}
        </aside>
      </div>
      <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">ⓘ &nbsp; Simulación interactiva — no reemplaza protocolos institucionales.</footer>
    </div>
  );
}
