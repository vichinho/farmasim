import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  TrainingLevel,
  TrainingLevelStatus,
} from "@/types/training-simulation";

const statusCopy: Record<
  TrainingLevelStatus,
  { badge: string; cta: string; tone: "brand" | "neutral" | "warning" }
> = {
  available: { badge: "Disponible", cta: "Entrar al nivel", tone: "brand" },
  completed: { badge: "Completado", cta: "Repetir nivel", tone: "brand" },
  "coming-soon": { badge: "Próximamente", cta: "En preparación", tone: "warning" },
  locked: { badge: "Bloqueado", cta: "Completa niveles anteriores", tone: "neutral" },
};

export function LevelSelector({ levels }: { levels: TrainingLevel[] }) {
  const availableLevelCount = levels.filter(
    (level) => level.status === "available" || level.status === "completed",
  ).length;

  return (
    <section aria-labelledby="level-list-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold" id="level-list-heading">
          Ruta de entrenamiento
        </h2>
        <span className="text-sm font-medium text-[var(--muted)]">
          {availableLevelCount} de {levels.length}{" "}
          {availableLevelCount === 1 ? "disponible" : "disponibles"}
        </span>
      </div>

      <ol className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {levels.map((level) => {
          const isAvailable = level.status === "available" || level.status === "completed";
          const status = statusCopy[level.status];
          const href = level.caseSlugs[0]
            ? `/simulaciones/${level.caseSlugs[0]}?nivel=${level.number}`
            : undefined;

          return (
            <li
              className={cn(
                "relative overflow-hidden rounded-3xl border bg-white p-5 shadow-[0_8px_30px_rgb(19_33_60/0.05)]",
                isAvailable
                  ? "border-emerald-200 bg-gradient-to-br from-white via-white to-emerald-50"
                  : "border-[var(--border)]",
              )}
              key={level.id}
            >
              <div
                aria-hidden="true"
                className={cn(
                  "absolute -right-4 -top-5 text-[7rem] font-black leading-none",
                  isAvailable ? "text-emerald-100" : "text-slate-100",
                )}
              >
                {level.number}
              </div>
              <div className="relative flex min-h-56 flex-col">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "grid size-11 place-items-center rounded-2xl text-lg font-black",
                      isAvailable
                        ? "bg-[var(--brand)] text-white"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {level.number}
                  </span>
                  <Badge tone={status.tone}>{status.badge}</Badge>
                </div>

                <h3 className="mt-5 text-xl font-bold">{level.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted)]">
                  {level.description}
                </p>

                {isAvailable && href ? (
                  <Link
                    className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
                    href={href}
                  >
                    {status.cta}
                    <span aria-hidden="true" className="ml-2">
                      →
                    </span>
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-500"
                  >
                    {status.cta}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
