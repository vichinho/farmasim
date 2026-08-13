import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SimulationResultProps = {
  correctAnswers: number;
  elapsedSeconds: number;
  earnedXp: number;
  incorrectAnswers: number;
  onRestart: () => void;
  score: number;
  text: string;
};

export function SimulationResult({
  correctAnswers,
  elapsedSeconds,
  earnedXp,
  incorrectAnswers,
  onRestart,
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
      <Button className="mt-6" fullWidth onClick={onRestart} size="lg">Repetir práctica</Button>
    </Card>
  );
}
