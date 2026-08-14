import { Badge } from "@/components/ui/badge";
import { FarmaVerseIcon } from "@/components/brand/farmaverse-logo";

type AppHeaderProps = {
  eyebrow?: string;
  title?: string;
};

export function AppHeader({
  eyebrow = "FarmaVerse",
  title = "Aprende. Practica. Simula.",
}: AppHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <FarmaVerseIcon className="size-9 shadow-sm" />
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
