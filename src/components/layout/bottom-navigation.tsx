import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type NavigationItem = {
  icon: "book" | "chart" | "home" | "play" | "user";
  label: string;
};

const navigationItems: NavigationItem[] = [
  { icon: "home", label: "Inicio" },
  { icon: "play", label: "Simular" },
  { icon: "book", label: "Aprender" },
  { icon: "chart", label: "Progreso" },
  { icon: "user", label: "Perfil" },
];

export function BottomNavigation() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--border)] bg-white/95 px-2 py-2 backdrop-blur md:mx-auto md:max-w-xl md:rounded-t-3xl md:border-x"
    >
      <ul className="mx-auto flex max-w-xl items-center justify-between">
        {navigationItems.map((item, index) => {
          const isActive = index === 0;

          return (
            <li key={item.label}>
              <button
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-[var(--brand-strong)]"
                    : "text-[var(--muted)] hover:bg-slate-50",
                )}
                type="button"
              >
                <Icon className="size-5" name={item.icon} />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
