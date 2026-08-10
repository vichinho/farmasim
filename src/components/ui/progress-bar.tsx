import { cn } from "@/lib/utils";

type ProgressBarProps = {
  className?: string;
  label: string;
  value: number;
};

export function ProgressBar({ className, label, value }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--foreground)]">{label}</span>
        <span className="font-semibold text-[var(--brand-strong)]">
          {clampedValue}%
        </span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={clampedValue}
        className="h-2.5 overflow-hidden rounded-full bg-emerald-100"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[var(--brand)] transition-[width]"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
