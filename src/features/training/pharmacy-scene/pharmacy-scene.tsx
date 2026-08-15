"use client";

import { cn } from "@/lib/utils";
import {
  CONTENT_TRACEABILITY_NOTE,
  type DispensingCriterionId,
  type TrainingCase,
  type TrainingStage,
} from "@/types/training-simulation";

import {
  getPatientProfile,
  type SceneFeedbackTone,
  type WorkspaceArea,
} from "./scene-types";
import { usePatientSceneState } from "./use-patient-scene-state";

type SafetyState = {
  activeAlert: boolean;
  interceptedErrorCount: number;
  unresolvedErrorCount: number;
};

type PharmacySceneProps = {
  caseId: string;
  context: TrainingCase["context"];
  feedbackTone: SceneFeedbackTone;
  isComplete: boolean;
  outcome: { errorReachedPatient: boolean };
  panel: React.ReactNode;
  safety: SafetyState;
  stage: TrainingStage;
  statusLabel: string;
};

const criterionRows: { id: DispensingCriterionId; label: string; group: string }[] = [
  { id: "criterion-1-request-identity-document", group: "Identificación", label: "Solicita carnet de identidad y/o crónico" },
  { id: "criterion-2-system-identity-match", group: "Identificación", label: "Digita RUT y verifica nombre de usuario" },
  { id: "criterion-3-identify-all-prescriptions", group: "Validación operativa", label: "Identifica todas las prescripciones disponibles" },
  { id: "criterion-4-confirm-prescription-issued", group: "Validación operativa", label: "Verifica que la receta esté emitida" },
  { id: "criterion-5-compare-prepared-items", group: "Preparación", label: "Medicamentos preparados corresponden a la receta" },
  { id: "criterion-6-recheck-identity-before-handoff", group: "Despacho", label: "Vuelve a verificar identidad antes de la entrega" },
  { id: "criterion-7-provide-corresponding-instructions", group: "Despacho", label: "Entrega las indicaciones correspondientes" },
];

const actionItems: { label: string; workspace: WorkspaceArea; icon: string }[] = [
  { label: "Solicitar documento", workspace: "service", icon: "▣" },
  { label: "Ir al computador", workspace: "system", icon: "▤" },
  { label: "Abrir prescripciones", workspace: "system", icon: "▱" },
  { label: "Revisar bandeja", workspace: "preparation", icon: "▥" },
  { label: "Verificar identidad final", workspace: "verification", icon: "◈" },
  { label: "Entregar indicaciones", workspace: "verification", icon: "◌" },
  { label: "Solicitar apoyo QF", workspace: "verification", icon: "+" },
];

export function PharmacyScene({
  caseId,
  context,
  feedbackTone,
  isComplete,
  outcome,
  panel,
  safety,
  stage,
  statusLabel,
}: PharmacySceneProps) {
  const profile = getPatientProfile(caseId);
  const scene = usePatientSceneState({ feedbackTone, isComplete, outcome, stage });

  return (
    <section aria-labelledby="pharmacy-scene-heading" className="space-y-3">
      <div className="overflow-hidden rounded-[1.8rem] border border-violet-100 bg-[#f8f7fc] shadow-[0_24px_70px_rgba(71,45,120,.16)]">
        <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(16rem,30rem)_auto] lg:items-center">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white shadow-md shadow-violet-200">+</div>
            <div>
              <p className="text-lg font-black tracking-tight text-violet-800">FarmaSim</p>
              <p className="text-xs font-semibold text-slate-500">Simulaciones · Caso 001</p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-700">
              <span>{statusLabel}</span>
              <span>{stage.title}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-violet-100">
              <div className="h-full w-1/2 rounded-full bg-violet-600" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ Entrenamiento</span>
            <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-800">{context.timeLabel}</span>
          </div>
        </header>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_29rem]">
          <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
            <div className="relative min-h-[610px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50">
              <PharmacyFloor activeWorkspace={scene.activeWorkspace} patientTurn={profile.turn} />

              <div className="absolute right-5 top-5 z-30 max-w-[18rem] rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-violet-600">Paso actual</p>
                <h2 className="mt-1 text-sm font-black text-slate-950" id="pharmacy-scene-heading">{stage.title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">{stage.content}</p>
              </div>

              <div className="absolute inset-x-4 bottom-4 z-40 sm:inset-x-auto sm:left-1/2 sm:w-[min(92%,43rem)] sm:-translate-x-1/2">
                <div className="max-h-[450px] overflow-auto rounded-[1.5rem] border border-violet-100 bg-white/97 p-1 shadow-[0_24px_70px_rgba(48,31,83,.22)] backdrop-blur">
                  {panel}
                </div>
              </div>
            </div>

            <ActionDock activeWorkspace={scene.activeWorkspace} />
          </div>

          <aside className="space-y-4 bg-white p-4 sm:p-5">
            <ObjectivesCard stage={stage} />
            <CriteriaCard activeCriterionIds={stage.criterionIds ?? []} />
            <SafetySummary safety={safety} />
            <ReminderCard />
          </aside>
        </div>

        <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">
          Simulación interactiva — no reemplaza protocolos institucionales.
        </footer>
      </div>

      <p className="px-2 text-xs leading-5 text-[var(--muted)]">
        {CONTENT_TRACEABILITY_NOTE} Escenario y pacientes completamente ficticios; esta actividad no reemplaza protocolos ni supervisión profesional.
      </p>
    </section>
  );
}

function PharmacyFloor({ activeWorkspace, patientTurn }: { activeWorkspace: WorkspaceArea; patientTurn: string }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-0 top-0 h-[61%] bg-gradient-to-b from-[#eee9f8] via-[#f5f4f8] to-[#e9eef4]" />
      <div className="absolute inset-x-0 bottom-0 h-[43%] bg-[linear-gradient(135deg,#e6e9ef_25%,transparent_25%),linear-gradient(225deg,#e6e9ef_25%,transparent_25%),linear-gradient(45deg,#e6e9ef_25%,transparent_25%),linear-gradient(315deg,#e6e9ef_25%,#f7f8fa_25%)] bg-[length:42px_42px]" />

      <div className="absolute left-[4%] top-[8%] hidden h-40 w-28 rounded-xl border-4 border-violet-200 bg-violet-100 p-3 text-center md:block">
        <div className="text-3xl font-black text-violet-700">+</div>
        <p className="mt-2 text-[0.6rem] font-black leading-4 text-violet-700">SEGURIDAD DEL PACIENTE</p>
        <p className="mt-3 text-left text-[0.58rem] font-bold leading-4 text-violet-600">✓ Verifica<br />✓ Confirma<br />✓ Comunica</p>
      </div>

      <div className="absolute left-[16%] top-[11%] hidden h-40 w-28 rounded-t-xl border-4 border-slate-300 bg-sky-100/70 md:block">
        <div className="mx-auto mt-3 w-16 rounded bg-white/70 px-2 py-1 text-center text-[0.52rem] font-black text-slate-500">ÁREA RESTRINGIDA</div>
      </div>

      <StorageWall active={activeWorkspace === "storage"} />
      <CounterFurniture />
      <Computer active={activeWorkspace === "system"} />
      <Actor className="left-[10%] top-[38%]" label={`Paciente · ${patientTurn}`} tone="patient" active={activeWorkspace === "service"} />
      <Actor className="left-[43%] top-[26%]" label="TENS 1 · Recepción" tone="staff" active={activeWorkspace === "service" || activeWorkspace === "system"} />
      <Actor className="left-[73%] top-[31%]" label="TENS 2 · Trayendo bandeja" tone="staff" active={activeWorkspace === "preparation"} tray />

      <Hotspot className="left-[16%] top-[66%]" active={activeWorkspace === "service"} label="Documento sobre el mesón" />
      <Hotspot className="left-[35%] top-[57%]" active={activeWorkspace === "system"} label="Computador" />
      <Hotspot className="left-[63%] top-[18%]" active={activeWorkspace === "storage"} label="Gavetas / almacenamiento" />
      <Hotspot className="left-[76%] top-[66%]" active={activeWorkspace === "preparation" || activeWorkspace === "verification"} label="Mesón de preparación" />
    </div>
  );
}

function CounterFurniture() {
  return (
    <>
      <div className="absolute left-[4%] top-[57%] h-[18%] w-[56%] -skew-x-6 rounded-xl border border-slate-300 bg-gradient-to-b from-white to-slate-200 shadow-xl" />
      <div className="absolute left-[53%] top-[61%] h-[20%] w-[39%] -skew-x-6 rounded-xl border border-slate-300 bg-gradient-to-b from-slate-50 to-slate-300 shadow-xl" />
      <div className="absolute left-[69%] top-[68%] h-5 w-24 rounded-md border-2 border-violet-300 bg-violet-100 shadow" />
    </>
  );
}

function StorageWall({ active }: { active: boolean }) {
  return (
    <div className={cn("absolute left-[56%] top-[9%] grid h-[34%] w-[36%] grid-cols-5 gap-1 rounded-xl border-4 bg-slate-500/80 p-2 shadow-xl transition", active ? "border-violet-500 ring-4 ring-violet-300/50" : "border-slate-400")}>
      {Array.from({ length: 30 }).map((_, index) => (
        <div className={cn("rounded-sm border border-white/60", index % 5 === 0 ? "bg-violet-200" : index % 4 === 0 ? "bg-emerald-100" : index % 3 === 0 ? "bg-amber-100" : "bg-white")} key={index} />
      ))}
    </div>
  );
}

function Computer({ active }: { active: boolean }) {
  return (
    <div className={cn("absolute left-[30%] top-[45%] z-10 transition", active && "scale-105")}> 
      <div className={cn("h-20 w-28 rounded-lg border-4 bg-slate-900 shadow-lg", active ? "border-violet-500 ring-4 ring-violet-300/50" : "border-slate-700")}>
        <div className="m-2 h-10 rounded bg-gradient-to-br from-violet-100 to-sky-100" />
      </div>
      <div className="mx-auto h-6 w-3 bg-slate-600" />
      <div className="mx-auto h-2 w-14 rounded-full bg-slate-700" />
    </div>
  );
}

function Actor({ active, className, label, tone, tray = false }: { active: boolean; className: string; label: string; tone: "patient" | "staff"; tray?: boolean }) {
  return (
    <div className={cn("absolute z-20 w-32 -translate-x-1/2 text-center transition", className, active && "scale-105")}>
      <div className={cn("mx-auto size-14 rounded-full border-4 bg-amber-100 shadow", tone === "staff" ? "border-violet-300" : "border-emerald-200", active && "ring-4 ring-violet-300/50")} />
      <div className={cn("mx-auto -mt-1 h-24 w-20 rounded-[2rem_2rem_1rem_1rem] border-4 shadow-md", tone === "staff" ? "border-violet-300 bg-violet-500" : "border-emerald-200 bg-emerald-500")} />
      {tray ? <div className="absolute left-1/2 top-24 h-5 w-28 -translate-x-1/2 rounded-md border-2 border-violet-300 bg-violet-100 shadow"><span className="absolute left-3 -top-3 size-4 rounded bg-white" /><span className="absolute left-9 -top-4 size-5 rounded bg-amber-100" /><span className="absolute right-3 -top-3 size-4 rounded bg-white" /></div> : null}
      <div className="mx-auto mt-2 inline-flex rounded-full border border-violet-200 bg-white/95 px-3 py-1 text-[0.66rem] font-black text-violet-700 shadow">{label}</div>
    </div>
  );
}

function Hotspot({ active, className, label }: { active: boolean; className: string; label: string }) {
  return (
    <div className={cn("absolute z-20 -translate-x-1/2", className)}>
      <div className={cn("mx-auto size-4 rounded-full border-4 border-white shadow transition", active ? "animate-pulse bg-violet-600 ring-4 ring-violet-300/60" : "bg-violet-400")} />
      <div className={cn("mt-1 whitespace-nowrap rounded-xl border bg-white/95 px-3 py-1.5 text-[0.64rem] font-black shadow", active ? "border-violet-300 text-violet-700" : "border-slate-200 text-slate-500")}>{label}</div>
    </div>
  );
}

function ActionDock({ activeWorkspace }: { activeWorkspace: WorkspaceArea }) {
  return (
    <div className="grid grid-cols-2 gap-2 border-t border-violet-100 bg-white p-3 sm:grid-cols-4 xl:grid-cols-7">
      {actionItems.map((item) => {
        const active = item.workspace === activeWorkspace;
        return (
          <div className={cn("flex min-h-20 items-center gap-3 rounded-2xl border px-3 py-3 transition", active ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-200" : "border-violet-100 bg-white text-violet-700")} key={item.label}>
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-lg font-black", active ? "bg-white/15" : "bg-violet-50")}>{item.icon}</span>
            <span className="text-[0.68rem] font-black leading-4">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ObjectivesCard({ stage }: { stage: TrainingStage }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">◎</div>
        <h3 className="font-black text-slate-900">Objetivos del caso</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-5 text-slate-700">
        <li>• Completar el proceso sin omitir verificaciones observables.</li>
        <li>• Validar identidad y revisar prescripciones ficticias.</li>
        <li>• Verificar medicamento, concentración, forma farmacéutica y cantidad.</li>
        <li>• Reconocer cuándo corresponde solicitar apoyo al QF.</li>
      </ul>
      <div className="mt-4 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Ahora: {stage.title}</div>
    </div>
  );
}

function CriteriaCard({ activeCriterionIds }: { activeCriterionIds: DispensingCriterionId[] }) {
  const grouped = ["Identificación", "Validación operativa", "Preparación", "Despacho"];
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">▤</div>
        <div>
          <h3 className="font-black text-slate-900">Criterios evaluados</h3>
          <p className="text-[0.65rem] text-slate-400">Seguimiento interno del caso</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {grouped.map((group) => {
          const rows = criterionRows.filter((row) => row.group === group);
          return (
            <section className="overflow-hidden rounded-xl border border-violet-100" key={group}>
              <div className="flex items-center justify-between bg-violet-50 px-3 py-2">
                <p className="text-xs font-black text-violet-700">{group}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[0.6rem] font-black text-violet-600">{rows.length}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {rows.map((row, index) => {
                  const active = activeCriterionIds.includes(row.id);
                  return (
                    <div className="flex items-start justify-between gap-3 px-3 py-2.5" key={row.id}>
                      <p className="text-[0.68rem] font-semibold leading-4 text-slate-700">{criterionRows.findIndex((item) => item.id === row.id) + 1}. {row.label}</p>
                      <span className={cn("shrink-0 rounded-md px-2 py-1 text-[0.56rem] font-black", active ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500")}>{active ? "En progreso" : "No evaluado"}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SafetySummary({ safety }: { safety: SafetyState }) {
  const active = safety.activeAlert || safety.unresolvedErrorCount > 0;
  return (
    <div className={cn("rounded-2xl border p-4", active ? "border-rose-200 bg-rose-50" : safety.interceptedErrorCount > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
      <div className="flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", active ? "bg-rose-600" : safety.interceptedErrorCount > 0 ? "bg-amber-500" : "bg-emerald-600")} />
        <p className="text-sm font-black text-slate-900">{active ? "Revisión requerida" : safety.interceptedErrorCount > 0 ? "Barrera aplicada" : "Sin alertas activas"}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">Errores pendientes: {safety.unresolvedErrorCount} · Interceptados: {safety.interceptedErrorCount}</p>
    </div>
  );
}

function ReminderCard() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔔</div>
        <div>
          <p className="font-black text-slate-900">NO OLVIDAR</p>
          <p className="mt-1 text-sm leading-5 text-slate-700">Verifica medicamento, concentración, forma farmacéutica y cantidad antes del despacho.</p>
        </div>
      </div>
    </div>
  );
}
