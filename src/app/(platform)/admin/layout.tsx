import type { ReactNode } from "react";

import { AdminShell } from "@/features/admin/admin-shell";
import { requireAdminContext } from "@/features/admin/access";

import "./admin-modules-responsive.css";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const context = await requireAdminContext();

  return (
    <AdminShell fullName={context.fullName}>
      <div className="admin-module-root">{children}</div>
    </AdminShell>
  );
}
