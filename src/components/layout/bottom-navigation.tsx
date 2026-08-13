import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type NavigationItem = {
  icon: "book" | "chart" | "home" | "play" | "user";
  href?: string;
  label: string;
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", icon: "home", label: "Inicio" },
  { href: "/simulaciones", icon: "play", label: "Simular" },
  { href: "/novedades", icon: "book", label: "Novedades" },
  { href: "/progreso", icon: "chart", label: "Progreso" },
  { icon: "user", label: "Perfil" },
];

type BottomNavigationProps = {
  activeHref: string;
};

export function BottomNavigation({ activeHref }: BottomNavigationProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--border)] bg-white/95 px-2 py-2 backdrop-blur md:mx-auto md:max-w-xl md:rounded-t-3xl md:border-x"
    >
      <ul className="mx-auto flex max-w-xl items-center justify-between">
        {navigationItems.map((item) => {
          const isActive = item.href === activeHref;

          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-emerald-50 text-[var(--brand-strong)]"
                      : "text-[var(--muted)] hover:bg-slate-50",
                  )}
                  href={item.href}
                >
                  <Icon className="size-5" name={item.icon} />
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-medium text-slate-400"
                  title="Próximamente"
                >
                  <Icon className="size-5" name={item.icon} />
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
