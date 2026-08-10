import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

type AppHeaderProps = {
  eyebrow?: string;
  title?: string;
};

export function AppHeader({
  eyebrow = "FarmaSim",
  title = "Aprende. Practica. Simula.",
}: AppHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-[var(--brand)] text-white shadow-sm">
            <Icon className="size-5" name="sparkles" />
          </div>
          <p className="text-sm font-bold tracking-tight text-[var(--foreground)]">
            {eyebrow}
          </p>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">{title}</p>
      </div>
      <Badge tone="brand">Demo</Badge>
    </header>
  );
}
