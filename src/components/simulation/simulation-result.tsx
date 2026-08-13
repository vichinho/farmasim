import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SaveSimulationAttemptResult } from "@/features/progress/actions";

type SimulationResultProps = {
  correctAnswers: number;
  elapsedSeconds: number;
  earnedXp: number;
  incorrectAnswers: number;
  isSaving: boolean;
  onRestart: () => void;
  onRetrySave: () => void;
  saveResult: SaveSimulationAttemptResult | null;
  score: number;
  text: string;
};

export function SimulationResult({
  correctAnswers,
  elapsedSeconds,
  earnedXp,
  incorrectAnswers,
  isSaving,
  onRestart,
  onRetrySave,
  saveResult,
  score,
  text,
}: SimulationResultProps) {
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSeconds = String(elapsedSeconds % 60).padStart(2, "0");

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white text-center">
      <p className="text-xs font-bold tracking-[0.14em] text-[var(--brand-strong)]">SIMULACIÓN COMPLETADA</p>
      <h2 className="mt-3 text-2xl font-bold">Práctica finalizada</h2>
      <p className="mt-3 leading-7 text-[var(--muted)]">{text}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl bg-white p-4">
          <dt className="text-sm text-[var(--muted)]">Precisión</dt>
          <dd className="mt-1 text-2xl font-bold text-[var(--brand-strong)]">{score}%</dd>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <dt className="text-sm text-[var(--muted)]">XP obtenido</dt>
          <dd className="mt-1 text-2xl font-bold text-[var(--brand-strong)]">+{earnedXp}</dd>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <dt className="text-sm text-[var(--muted)]">Acertadas</dt>
          <dd className="mt-1 text-2xl font-bold">{correctAnswers}</dd>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <dt className="text-sm text-[var(--muted)]">Por mejorar</dt>
          <dd className="mt-1 text-2xl font-bold">{incorrectAnswers}</dd>
        </div>
        <div className="col-span-2 rounded-2xl bg-white p-4">
          <dt className="text-sm text-[var(--muted)]">Tiempo</dt>
          <dd className="mt-1 text-2xl font-bold">{elapsedMinutes}:{remainingSeconds}</dd>
        </div>
      </dl>
      <div
        aria-live="polite"
        className="mt-4 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
      >
        {isSaving ? "Guardando tu progreso..." : saveResult?.message ?? "Preparando el guardado..."}
      </div>
      {saveResult?.status === "error" ? (
        <Button className="mt-3" fullWidth onClick={onRetrySave} variant="secondary">
          Reintentar guardado
        </Button>
      ) : null}
      <Button className="mt-6" disabled={isSaving} fullWidth onClick={onRestart} size="lg">
        Repetir práctica
      </Button>
    </Card>
  );
}
