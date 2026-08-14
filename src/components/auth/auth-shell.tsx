import type { ReactNode } from "react";
import Link from "next/link";

import { FarmaVerseLogo } from "@/components/brand/farmaverse-logo";
import { Card } from "@/components/ui/card";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-7">
          <FarmaVerseLogo className="mb-5 w-44" priority />
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>
        {children}
        <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">
          FarmaVerse usa datos mínimos para operar la cuenta.{" "}
          <Link className="font-semibold text-[var(--brand-strong)] hover:underline" href="/privacidad">
            Ver privacidad
          </Link>
        </p>
      </Card>
    </main>
  );
}
