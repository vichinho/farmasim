import { Card } from "@/components/ui/card";
import type { ChoiceNode as ChoiceNodeData, SimulationChoice } from "@/types/simulation";

type ChoiceNodeProps = {
  node: ChoiceNodeData;
  onChoose: (choice: SimulationChoice) => void;
};

export function ChoiceNode({ node, onChoose }: ChoiceNodeProps) {
  return (
    <Card>
      <p className="text-xs font-bold tracking-[0.14em] text-[var(--brand-strong)]">DECISIÓN</p>
      <h2 className="mt-3 text-xl font-bold">{node.prompt}</h2>
      <p className="mt-2 leading-7 text-[var(--muted)]">{node.text}</p>
      <div className="mt-6 space-y-3">
        {node.choices.map((choice) => (
          <button
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-4 text-left text-base font-semibold leading-6 transition-colors hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
            key={choice.id}
            onClick={() => onChoose(choice)}
            type="button"
          >
            {choice.text}
          </button>
        ))}
      </div>
    </Card>
  );
}
