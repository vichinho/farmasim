"use client";

import { cn } from "@/lib/utils";
import {
  CONTENT_TRACEABILITY_NOTE,
  type DispensingCriterionId,
  type TrainingCase,
  type TrainingStage,
} from "@/types/training-simulation";

import {
  type SceneFeedbackTone,
  type WorkspaceArea,
} from "./scene-types";
import { usePatientSceneState } from "./use-patient-scene-state";

type SafetyState = {
  activeAlert: boolean;
  interceptedErrorCount: number;
  unresolvedErrorCount: number;
};

type RealisticPharmacySceneProps = {
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

type ScenePreset = {
  badge: string;
  subtitle: string;
  objectives: string[];
  reminder: string;
  hidePatient?: boolean;
};

const criterionRows: { id: DispensingCriterionId; label: string }[] = [
  { id: "criterion-1-request-identity-document", label: "Solicita carnet de identidad y/o crónico" },
  { id: "criterion-2-system-identity-match", label: "Digita RUT y verifica nombre de usuario" },
  { id: "criterion-3-identify-all-prescriptions", label: "Identifica todas las prescripciones disponibles" },
  { id: "criterion-4-confirm-prescription-issued", label: "Verifica que la receta esté emitida" },
  { id: "criterion-5-compare-prepared-items", label: "Medicamentos preparados corresponden a la receta" },
  { id: "criterion-6-recheck-identity-before-handoff", label: "Vuelve a verificar identidad antes de la entrega" },
  { id: "criterion-7-provide-corresponding-instructions", label: "Entrega las indicaciones correspondientes" },
];

const WORKSPACE_LABELS: Record<WorkspaceArea, string> = {
  service: "Paciente",
  system: "Computador",
  storage: "Gavetas / almacenamiento",
  preparation: "Bandeja / preparación",
  verification: "Verificación final",
};

function getCaseNumber(caseId: string) {
  const match = caseId.match(/case-(\d{3})/);
  return match?.[1] ?? "---";
}

function getPreset(caseId: string): ScenePreset {
  if (caseId === "case-002-concentration-reinforcement") {
    return {
      badge: "Refuerzo",
      subtitle: "Comparación de concentración · Metformina",
      objectives: [
        "Comparar la concentración solicitada con la presentación disponible.",
        "Distinguir productos visualmente similares antes de seleccionarlos.",
        "Corregir una selección antes de continuar si detectas una discrepancia.",
      ],
      reminder: "Compara nombre, concentración, forma farmacéutica y cantidad antes de confirmar una selección.",
    };
  }

  if (caseId === "case-003-concentration-reinforcement") {
    return {
      badge: "Refuerzo",
      subtitle: "Comparación de concentración · Amlodipino",
      objectives: [
        "Repetir la verificación en un contexto visual diferente.",
        "Comparar la concentración solicitada antes de seleccionar el producto.",
        "Mantener la barrera de seguridad aunque cambie la disposición del escenario.",
      ],
      reminder: "No asumas que una caja similar corresponde a la misma concentración.",
    };
  }

  if (caseId === "case-004-concentration-reinforcement") {
    return {
      badge: "Consolidación",
      subtitle: "Consolidación · Omeprazol",
      objectives: [
        "Consolidar la comparación de presentaciones antes de la entrega.",
        "Identificar diferencias de concentración con menor orientación.",
        "Completar la verificación sin omitir pasos observables.",
      ],
      reminder: "La similitud visual del envase nunca sustituye la comparación de los datos del producto.",
    };
  }

  if (caseId === "case-005-storage-review") {
    return {
      badge: "Almacenamiento",
      subtitle: "Revisión diaria de almacenamiento",
      hidePatient: true,
      objectives: [
        "Comprobar código y nombre del producto ficticio.",
        "Registrar el estado de almacenamiento mostrado por la actividad.",
        "Dejar una observación cuando corresponda antes de cerrar la revisión.",
      ],
      reminder: "Completa el registro visible y deriva al QF cualquier condición no prevista por el escenario.",
    };
  }

  if (caseId === "case-006-multiple-errors") {
    return {
      badge: "Discrepancias múltiples",
      subtitle: "Revisión simultánea de atributos",
      objectives: [
        "Detectar más de una discrepancia antes del despacho.",
        "Comparar concentración y cantidad de forma independiente.",
        "Aplicar las barreras de seguridad antes de cerrar la atención.",
      ],
      reminder: "Encontrar una discrepancia no significa que la revisión esté terminada: comprueba todos los atributos.",
    };
  }

  return {
    badge: "Modo experto",
    subtitle: "Verificación autónoma con orientación reducida",
    objectives: [
      "Completar el proceso con mínima orientación visual.",
      "Detectar discrepancias antes de la entrega.",
      "Decidir cuándo corresponde detener el proceso y solicitar apoyo.",
    ],
    reminder: "En modo experto las pistas son menores: mantén el orden de verificación aunque no exista una alerta visible.",
  };
}

function parseProgress(statusLabel: string) {
  const match = statusLabel.match(/Etapa\s+(\d+)\s+de\s+(\d+)/i);
  if (!match) return 0;
  const current = Number(match[1]);
  const total = Number(match[2]);
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}

export function RealisticPharmacyScene({
  caseId,
  context,
  feedbackTone,
  isComplete,
  outcome,
  panel,
  safety,
  stage,
  statusLabel,
}: RealisticPharmacySceneProps) {
  const scene = usePatientSceneState({ feedbackTone, isComplete, outcome, stage });
  const preset = getPreset(caseId);
  const caseNumber = getCaseNumber(caseId);
  const progress = parseProgress(statusLabel);
  const isStorage = caseId === "case-005-storage-review";

  return (
    <section aria-labelledby="realistic-scene-heading" className="space-y-3">
      <div className="overflow-hidden rounded-[1.8rem] border border-violet-100 bg-white shadow-[0_24px_70px_rgba(71,45,120,.14)]">
        <header className="grid gap-4 border-b border-violet-100 bg-white px-5 py-4 lg:grid-cols-[1fr_minmax(16rem,30rem)_auto] lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-700 text-2xl font-black text-white shadow-md shadow-violet-200">+</div>
            <div className="min-w-0">
              <p className="text-lg font-black tracking-tight text-violet-800">FarmaSim</p>
              <p className="truncate text-xs font-semibold text-slate-500">Simulaciones · Caso {caseNumber} · {preset.subtitle}</p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-700">
              <span>{statusLabel}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-violet-100">
              <div className="h-full rounded-full bg-violet-600 transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">★ {preset.badge}</span>
            <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-800">{context.timeLabel}</span>
          </div>
        </header>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_27.5rem]">
          <div className="min-w-0 border-b border-violet-100 xl:border-b-0 xl:border-r">
            <div className="relative min-h-[650px] overflow-hidden bg-[#e9e8ec]">
              <img
                alt={isStorage ? "Área ficticia de farmacia para revisión de almacenamiento" : "Farmacia ambulatoria ficticia para simulación"}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover object-center",
                  isStorage && "scale-[1.08] object-[70%_45%]",
                )}
                decoding="async"
                draggable={false}
                src="/images/farmasim/case001-scene.png"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-white/5" />
              {isStorage ? <div className="pointer-events-none absolute inset-0 bg-slate-950/10" /> : null}

              <SceneHotspots activeWorkspace={scene.activeWorkspace} hidePatient={preset.hidePatient} storageMode={isStorage} />

              <div className="absolute right-5 top-5 z-30 hidden max-w-[19rem] rounded-2xl border border-white/80 bg-white/92 px-4 py-3 shadow-lg backdrop-blur md:block">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-violet-600">Paso actual</p>
                <h2 className="mt-1 text-sm font-black text-slate-950" id="realistic-scene-heading">{stage.title}</h2>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{stage.content.replace(CONTENT_TRACEABILITY_NOTE, "").trim()}</p>
              </div>

              <div className="absolute inset-x-4 bottom-4 z-40 sm:inset-x-auto sm:left-5 sm:w-[min(92%,35rem)]">
                <div className="max-h-[430px] overflow-auto rounded-[1.45rem] border border-violet-100 bg-white/97 p-1 shadow-[0_24px_70px_rgba(48,31,83,.22)] backdrop-blur-md">
                  {panel}
                </div>
              </div>
            </div>

            <ActionDock activeWorkspace={scene.activeWorkspace} storageMode={isStorage} />
          </div>

          <aside className="space-y-4 bg-white p-4 sm:p-5">
            <ObjectivesCard objectives={preset.objectives} stageTitle={stage.title} />
            {!isStorage ? <CriteriaCard activeCriterionIds={stage.criterionIds ?? []} /> : <StorageChecklist stage={stage} />}
            <SafetySummary safety={safety} />
            <ReminderCard text={preset.reminder} />
          </aside>
        </div>

        <footer className="border-t border-violet-100 bg-white px-5 py-3 text-center text-xs font-semibold text-slate-500">
          Simulación interactiva — no reemplaza protocolos institucionales.
        </footer>
      </div>
    </section>
  );
}

function SceneHotspots({ activeWorkspace, hidePatient, storageMode }: { activeWorkspace: WorkspaceArea; hidePatient?: boolean; storageMode: boolean }) {
  const points = storageMode
    ? [
        { id: "storage", label: "Gavetas / almacenamiento", left: "72%", top: "21%", workspace: "storage" as WorkspaceArea },
        { id: "record", label: "Registro diario", left: "62%", top: "62%", workspace: "storage" as WorkspaceArea },
        { id: "product", label: "Producto F-102", left: "76%", top: "72%", workspace: "storage" as WorkspaceArea },
      ]
    : [
        { id: "patient", label: "Paciente", left: "8%", top: "61%", workspace: "service" as WorkspaceArea },
        { id: "reception", label: "TENS 1 · Recepción", left: "46%", top: "23%", workspace: "service" as WorkspaceArea },
        { id: "computer", label: "Computador", left: "39%", top: "64%", workspace: "system" as WorkspaceArea },
        { id: "storage", label: "Gavetas / almacenamiento", left: "73%", top: "13%", workspace: "storage" as WorkspaceArea },
        { id: "preparation", label: "TENS 2 · Preparación", left: "79%", top: "39%", workspace: "preparation" as WorkspaceArea },
        { id: "tray", label: "Bandeja", left: "75%", top: "67%", workspace: "verification" as WorkspaceArea },
      ];

  return (
    <>
      {points.filter((point) => !(hidePatient && point.id === "patient")).map((point) => {
        const active = point.workspace === activeWorkspace || (point.id === "tray" && activeWorkspace === "preparation");
        return (
          <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" key={point.id} style={{ left: point.left, top: point.top }}>
            <span className={cn("mx-auto block size-4 rounded-full border-[3px] border-white bg-violet-500 shadow-[0_3px_12px_rgba(76,29,149,.35)]", active && "bg-violet-700 ring-[6px] ring-violet-300/35")} />
            <span className={cn("mt-1.5 block whitespace-nowrap rounded-xl border bg-white/95 px-3 py-1.5 text-[0.64rem] font-extrabold shadow-[0_5px_18px_rgba(15,23,42,.10)] backdrop-blur-sm", active ? "border-violet-300 text-violet-700" : "border-violet-100 text-slate-700")}>
              {point.label}
            </span>
          </div>
        );
      })}
    </>
  );
}

function ActionDock({ activeWorkspace, storageMode }: { activeWorkspace: WorkspaceArea; storageMode: boolean }) {
  const items = storageMode
    ? [
        { label: "Abrir pauta", workspace: "storage" as WorkspaceArea, icon: "▤" },
        { label: "Comprobar código", workspace: "storage" as WorkspaceArea, icon: "#" },
        { label: "Comprobar nombre", workspace: "storage" as WorkspaceArea, icon: "Aa" },
        { label: "Registrar estado", workspace: "storage" as WorkspaceArea, icon: "✓" },
        { label: "Observación", workspace: "storage" as WorkspaceArea, icon: "✎" },
      ]
    : [
        { label: "Solicitar documento", workspace: "service" as WorkspaceArea, icon: "ID" },
        { label: "Ir al computador", workspace: "system" as WorkspaceArea, icon: "▣" },
        { label: "Abrir prescripciones", workspace: "system" as WorkspaceArea, icon: "▤" },
        { label: "Revisar bandeja", workspace: "preparation" as WorkspaceArea, icon: "Rx" },
        { label: "Verificar identidad", workspace: "verification" as WorkspaceArea, icon: "✓" },
        { label: "Entregar indicaciones", workspace: "verification" as WorkspaceArea, icon: "…" },
        { label: "Solicitar apoyo QF", workspace: "verification" as WorkspaceArea, icon: "+" },
      ];

  return (
    <div className={cn("grid gap-2 border-t border-violet-100 bg-white p-3", storageMode ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4 xl:grid-cols-7")}>
      {items.map((item) => {
        const active = item.workspace === activeWorkspace;
        return (
          <div className={cn("flex min-h-[4.65rem] min-w-0 items-center gap-2 rounded-2xl border px-3 py-2.5 transition", active ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-200" : "border-violet-100 bg-white text-violet-700")} key={item.label}>
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl text-xs font-black", active ? "bg-white/15" : "bg-violet-50")}>{item.icon}</span>
            <span className="min-w-0 text-[0.66rem] font-black leading-4">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ObjectivesCard({ objectives, stageTitle }: { objectives: string[]; stageTitle: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">◎</div>
        <h3 className="font-black text-slate-900">Objetivos del caso</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-5 text-slate-700">
        {objectives.map((objective) => <li key={objective}>• {objective}</li>)}
      </ul>
      <div className="mt-4 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Ahora: {stageTitle}</div>
    </div>
  );
}

function CriteriaCard({ activeCriterionIds }: { activeCriterionIds: DispensingCriterionId[] }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">≡</div>
        <h3 className="font-black text-slate-900">Criterios evaluados</h3>
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        {criterionRows.map((row, index) => {
          const active = activeCriterionIds.includes(row.id);
          return (
            <div className="flex items-start justify-between gap-3 py-2.5" key={row.id}>
              <p className="text-[0.68rem] font-semibold leading-4 text-slate-700">{index + 1}. {row.label}</p>
              <span className={cn("shrink-0 rounded-md px-2 py-1 text-[0.56rem] font-black", active ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500")}>{active ? "En curso" : "Pendiente"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StorageChecklist({ stage }: { stage: TrainingStage }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-violet-100 font-black text-violet-700">✓</div>
        <h3 className="font-black text-slate-900">Pauta de almacenamiento</h3>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <p>□ Código del producto</p>
        <p>□ Nombre del producto</p>
        <p>□ Estado de almacenamiento</p>
        <p>□ Observación</p>
      </div>
      <div className="mt-4 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Etapa: {stage.title}</div>
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
      <p className="mt-2 text-xs leading-5 text-slate-600">Pendientes: {safety.unresolvedErrorCount} · Interceptados: {safety.interceptedErrorCount}</p>
    </div>
  );
}

function ReminderCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
      <p className="font-black text-slate-900">🔔 NO OLVIDAR</p>
      <p className="mt-1 text-sm leading-5 text-slate-700">{text}</p>
    </div>
  );
}
