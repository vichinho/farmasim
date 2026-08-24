import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ProfileOverviewProps = {
  closeOtherSessionsAction: () => Promise<void>;
  completedLevels: number;
  email: string;
  fullName: string;
  level: number;
  logoutAction: () => Promise<void>;
  role: string;
  sessionStarted: string;
  sessionsCompleted: number;
  sessionsStatus?: string;
  totalLevels: number;
  totalXp: number;
};

type ProfileIconName = "award" | "book" | "chevron" | "logout" | "shield" | "sparkles";

const iconPaths: Record<ProfileIconName, string> = {
  award: "M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-3.5-1.2L7 22l5-3 5 3-1.5-8.2",
  book: "M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5m0-17v17m0-17A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5",
  chevron: "m9 18 6-6-6-6",
  logout: "M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-4",
  sparkles: "m12 3-1.2 5.3L5.5 9.5l5.3 1.2L12 16l1.2-5.3 5.3-1.2-5.3-1.2L12 3Zm6.5 13-.6 2.4-2.4.6 2.4.6.6 2.4.6-2.4 2.4-.6-2.4-.6-.6-2.4Z",
};

function ProfileIcon({ className = "size-5", name }: { className?: string; name: ProfileIconName }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FV";
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
}

function getRoleLabel(role: string) {
  if (role === "admin") return "Administrador";
  if (role === "supervisor") return "Supervisor/QF";
  return "TENS";
}

function Metric({
  icon,
  label,
  value,
  valueAccent,
}: {
  icon: ProfileIconName;
  label: string;
  value: string;
  valueAccent?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 border-l border-[var(--border)] px-2 py-3 text-center first:border-l-0 sm:flex-row sm:justify-center sm:gap-3 sm:px-4 sm:text-left lg:px-6">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-[var(--brand)]">
        <ProfileIcon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
        <p className="mt-0.5 whitespace-nowrap text-lg font-black tracking-tight text-[var(--foreground)]">
          {value}{valueAccent ? <span className="ml-1 text-amber-500">{valueAccent}</span> : null}
        </p>
      </div>
    </div>
  );
}

export function ProfileOverview({
  closeOtherSessionsAction,
  completedLevels,
  email,
  fullName,
  level,
  logoutAction,
  role,
  sessionStarted,
  sessionsCompleted,
  sessionsStatus,
  totalLevels,
  totalXp,
}: ProfileOverviewProps) {
  const progress = totalLevels === 0 ? 0 : Math.round((completedLevels / totalLevels) * 100);
  const formattedXp = new Intl.NumberFormat("es-CL").format(totalXp);

  return (
    <PageContainer className="space-y-5 sm:space-y-6">
      <header className="max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--brand)]">Cuenta personal</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Mi perfil</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)] sm:text-base">
          Administra tu información, progreso y seguridad desde un solo lugar.
        </p>
      </header>

      {sessionsStatus === "closed" ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900" role="status">
          Las demás sesiones fueron cerradas. Esta sesión sigue activa.
        </p>
      ) : null}
      {sessionsStatus === "error" ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800" role="alert">
          No fue posible cerrar las otras sesiones. Inténtalo nuevamente.
        </p>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="grid gap-2 p-5 sm:p-6 lg:grid-cols-[minmax(19rem,0.85fr)_minmax(31rem,1.15fr)] lg:items-center">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-[var(--brand-strong)] text-xl font-black text-white shadow-sm sm:size-20 sm:text-2xl">
              {getInitials(fullName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-black tracking-tight sm:text-2xl">{fullName}</h2>
                <Badge tone="brand">{getRoleLabel(role)}</Badge>
              </div>
              <p className="mt-1.5 truncate text-sm text-[var(--muted)]">{email}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 border-t border-[var(--border)] pt-3 lg:mt-0 lg:border-t-0 lg:pt-0">
            <Metric icon="award" label="Nivel actual" value={`Nivel ${level}`} />
            <Metric icon="sparkles" label="Experiencia" value={formattedXp} valueAccent="XP" />
            <Metric icon="book" label="Práctica" value={`${sessionsCompleted} casos`} />
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]">
        <Card className="p-0">
          <div className="p-5 sm:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--brand)]">Tu cuenta</p>
              <h2 className="mt-1 text-xl font-black">Información personal</h2>
            </div>

            <dl className="mt-5 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:items-center">
                <dt className="text-sm text-[var(--muted)]">Nombre completo</dt>
                <dd className="text-sm font-semibold text-[var(--foreground)]">{fullName}</dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:items-center">
                <dt className="text-sm text-[var(--muted)]">Correo electrónico</dt>
                <dd className="break-all text-sm font-semibold text-[var(--foreground)]">{email}</dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:items-center">
                <dt className="text-sm text-[var(--muted)]">Rol</dt>
                <dd className="text-sm font-semibold text-[var(--foreground)]">{getRoleLabel(role)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
              FarmaVerse no solicita RUT, fecha de nacimiento ni datos clínicos reales.
            </p>
          </div>

          <div className="border-t border-[var(--border)] bg-slate-50/70 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-black">Progreso de formación</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {completedLevels} de {totalLevels} niveles completados
                </p>
              </div>
              <Link className="text-sm font-bold text-[var(--brand-strong)] hover:underline" href="/progreso">
                Ver progreso completo
              </Link>
            </div>
            <div
              aria-label={`${progress}% del itinerario completado`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress}
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-emerald-100"
              role="progressbar"
            >
              <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--brand)]">Protección</p>
                <h2 className="mt-1 text-xl font-black">Seguridad</h2>
              </div>
              <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-[var(--brand)]">
                <ProfileIcon name="shield" />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold">Sesión actual</p>
                <Badge tone="brand">Activa</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Iniciada: {sessionStarted}</p>
            </div>

            <div className="mt-4 grid gap-2">
              <form action={closeOtherSessionsAction}>
                <Button className="w-full justify-start" type="submit" variant="secondary">
                  <ProfileIcon className="mr-2 size-4" name="shield" />
                  Cerrar otras sesiones
                </Button>
              </form>
              <form action={logoutAction}>
                <Button className="w-full justify-start text-red-700 hover:bg-red-50" type="submit" variant="ghost">
                  <ProfileIcon className="mr-2 size-4" name="logout" />
                  Cerrar esta sesión
                </Button>
              </form>
            </div>
          </Card>

          <Card className="bg-slate-50/80">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-[var(--brand)] shadow-sm">
                <ProfileIcon name="shield" />
              </span>
              <div>
                <h2 className="font-black">Privacidad</h2>
                <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">Conoce qué información conserva la plataforma.</p>
              </div>
            </div>
            <Link className="mt-4 flex items-center justify-between text-sm font-bold text-[var(--brand-strong)] hover:underline" href="/privacidad">
              Revisar el aviso de privacidad
              <ProfileIcon className="size-4" name="chevron" />
            </Link>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
