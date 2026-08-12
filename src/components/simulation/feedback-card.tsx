import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SimulationChoice } from "@/types/simulation";

type FeedbackCardProps = {
  choice: SimulationChoice;
  onContinue: () => void;
};

export function FeedbackCard({ choice, onContinue }: FeedbackCardProps) {
  return (
    <Card className={choice.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}>
      <Badge tone={choice.isCorrect ? "brand" : "warning"}>
        {choice.isCorrect ? "Decisión acertada" : "Oportunidad de mejora"}
      </Badge>
      <p className="mt-4 text-lg font-bold">{choice.text}</p>
      <p className="mt-3 leading-7 text-[var(--muted)]">{choice.feedback}</p>
      {choice.xpReward > 0 ? (
        <p className="mt-4 text-sm font-bold text-[var(--brand-strong)]">+{choice.xpReward} XP</p>
      ) : null}
      <Button className="mt-6" fullWidth onClick={onContinue} size="lg">Continuar</Button>
    </Card>
  );
}
