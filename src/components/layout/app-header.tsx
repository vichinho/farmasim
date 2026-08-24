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
    <header className="flex min-w-0 flex-1 items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <FarmaVerseIcon className="size-9 shrink-0" />
          <p className="truncate text-sm font-bold tracking-tight text-[var(--foreground)]">
            {eyebrow}
          </p>
        </div>
        <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{title}</p>
      </div>
      <Badge className="shrink-0" tone="brand">Demo</Badge>
    </header>
  );
}
