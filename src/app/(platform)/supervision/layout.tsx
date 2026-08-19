import type { ReactNode } from "react";

import { logout } from "@/features/auth/actions";

export default function SupervisionLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-7xl justify-end px-4 pt-4 sm:px-6 lg:px-8">
        <form action={logout}>
          <button
            className="min-h-10 rounded-xl border border-violet-200 bg-white px-4 text-sm font-black text-violet-700 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            type="submit"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
      {children}
    </>
  );
}
