import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DialogueNode as DialogueNodeData } from "@/types/simulation";

type DialogueNodeProps = {
  node: DialogueNodeData;
  onContinue: () => void;
};

export function DialogueNode({ node, onContinue }: DialogueNodeProps) {
  return (
    <Card className="space-y-5">
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-[var(--brand-strong)]">DIÁLOGO</p>
        <p className="mt-3 text-sm font-semibold text-[var(--muted)]">{node.characterName}</p>
        <p className="mt-2 text-lg leading-8 text-[var(--foreground)]">{node.text}</p>
      </div>
      <Button fullWidth onClick={onContinue} size="lg">Continuar</Button>
    </Card>
  );
}
