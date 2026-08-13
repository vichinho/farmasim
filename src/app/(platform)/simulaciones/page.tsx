import { PageContainer } from "@/components/layout/page-container";
import { SimulationEngine } from "@/components/simulation/simulation-engine";
import { Badge } from "@/components/ui/badge";
import { firstAttentionScenario } from "@/data/demo-scenarios/first-attention";

export default function SimulationsPage() {
  return (
    <PageContainer className="max-w-2xl space-y-6">
      <header>
        <Badge tone="brand">Nuevo usuario</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{firstAttentionScenario.title}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{firstAttentionScenario.description}</p>
      </header>
      <SimulationEngine scenario={firstAttentionScenario} />
    </PageContainer>
  );
}
