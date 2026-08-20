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
  { href: "/perfil", icon: "user", label: "Perfil" },
];

type BottomNavigationProps = {
  activeHref: string;
};

export function BottomNavigation({ activeHref }: BottomNavigationProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-white/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur md:mx-auto md:max-w-xl md:rounded-t-3xl md:border-x"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 items-stretch">
        {navigationItems.map((item) => {
          const isActive = item.href === activeHref;

          return (
            <li className="min-w-0" key={item.label}>
              {item.href ? (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.68rem] font-medium leading-tight transition-colors sm:px-2 sm:text-xs",
                    isActive
                      ? "bg-emerald-50 text-[var(--brand-strong)]"
                      : "text-[var(--muted)] hover:bg-slate-50",
                  )}
                  href={item.href}
                >
                  <Icon className="size-5 shrink-0" name={item.icon} />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="flex min-h-12 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.68rem] font-medium leading-tight text-slate-400 sm:px-2 sm:text-xs"
                  title="Próximamente"
                >
                  <Icon className="size-5 shrink-0" name={item.icon} />
                  <span className="max-w-full truncate">{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
