import { ProgressBar } from "@/components/ui/progress-bar";

type SimulationProgressProps = {
  completedChoices: number;
  totalChoices: number;
};

export function SimulationProgress({ completedChoices, totalChoices }: SimulationProgressProps) {
  const progress = totalChoices === 0 ? 0 : Math.round((completedChoices / totalChoices) * 100);

  return <ProgressBar label="Avance de la práctica" value={progress} />;
}
