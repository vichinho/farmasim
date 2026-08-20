"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { logout } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
  fullName: string;
};

type IconName = "home" | "users" | "building" | "scenario" | "capsule" | "analytics" | "audit" | "settings" | "menu" | "close" | "logout";

type NavigationItem = {
  href: string;
  icon: IconName;
  label: string;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    label: "General",
    items: [{ href: "/admin", icon: "home", label: "Resumen" }],
  },
  {
    label: "Gestión",
    items: [
      { href: "/admin/usuarios", icon: "users", label: "Usuarios" },
      { href: "/admin/establecimientos", icon: "building", label: "Establecimientos" },
    ],
  },
  {
    label: "Capacitación",
    items: [
      { href: "/admin/escenarios", icon: "scenario", label: "Escenarios" },
      { href: "/admin/capsulas", icon: "capsule", label: "Cápsulas" },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      { href: "/admin/analitica", icon: "analytics", label: "Analítica" },
      { href: "/admin/auditoria", icon: "audit", label: "Auditoría" },
    ],
  },
  {
    label: "Sistema",
    items: [{ href: "/admin/configuracion", icon: "settings", label: "Configuración" }],
  },
];

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  const paths: Record<IconName, ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5" /><path d="M9.5 21v-6h5v6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    building: <><path d="M4 21V5l8-3v19" /><path d="M12 8h8v13" /><path d="M7 8h1M7 12h1M7 16h1M15 11h2M15 15h2" /></>,
    scenario: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h5M7 16h8" /></>,
    capsule: <><path d="M10.5 4.5 4.5 10.5a5 5 0 0 0 7 7l6-6a5 5 0 0 0-7-7Z" /><path d="m8 8 8 8" /></>,
    analytics: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    audit: <><path d="M9 5H6a2 2 0 0 0-2 2v12h14v-3" /><path d="M9 3h6v4H9z" /><path d="m14 13 2 2 4-5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15.03 1.7 1.7 0 0 0 3.09 14H3v-4h.09A1.7 1.7 0 0 0 4.6 8.97a1.7 1.7 0 0 0-.34-1.88L4.2 7.03 7.03 4.2l.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 10 3.09V3h4v.09a1.7 1.7 0 0 0 1.03 1.51 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.91 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
  };

  return <svg aria-hidden="true" {...common}>{paths[name]}</svg>;
}

function initials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD";
}

export function AdminShell({ children, fullName }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = (
    <div className="flex h-full flex-col bg-[#14111d] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Link className="flex items-center gap-3" href="/admin" onClick={() => setMobileOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500 font-black shadow-[0_10px_30px_rgba(139,92,246,.28)]">F</span>
          <span>
            <span className="block text-sm font-black tracking-tight">FarmaVerse</span>
            <span className="block text-[11px] font-bold uppercase tracking-[.18em] text-violet-300">Administración</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegación de administración">
        {navigationGroups.map((group) => (
          <div className="mb-5" key={group.label}>
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-500">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <Link
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition",
                      active
                        ? "bg-violet-500/16 text-white ring-1 ring-inset ring-violet-400/25"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                    )}
                    href={item.href}
                    key={item.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className={cn("h-[18px] w-[18px]", active && "text-violet-300")} name={item.icon} />
                    <span>{item.label}</span>
                    {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-300" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[.04] p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-black text-violet-200">{initials(fullName)}</span>
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-white">{fullName}</p>
            <p className="text-[11px] font-semibold text-slate-500">Administrador global</p>
          </div>
        </div>
        <form action={logout}>
          <button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400" type="submit">
            <Icon className="h-[18px] w-[18px]" name="logout" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#f7f7fa] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-900/10 lg:block">{navigation}</aside>

      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <button aria-expanded={mobileOpen} aria-label="Abrir menú de administración" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm" onClick={() => setMobileOpen(true)} type="button">
          <Icon name="menu" />
        </button>
        <div className="text-center">
          <p className="text-sm font-black">FarmaVerse Admin</p>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-violet-600">Panel global</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-xs font-black text-violet-700">{initials(fullName)}</span>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Cerrar menú" className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} type="button" />
          <aside className="absolute inset-y-0 left-0 w-[min(19rem,88vw)] shadow-2xl">
            <button aria-label="Cerrar menú" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white" onClick={() => setMobileOpen(false)} type="button">
              <Icon name="close" />
            </button>
            {navigation}
          </aside>
        </div>
      ) : null}

      <main className="min-h-dvh lg:pl-72">
        <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8 xl:p-10">{children}</div>
      </main>
    </div>
  );
}
