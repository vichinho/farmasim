import type { ReactNode } from "react";

import { AdminShell } from "@/features/admin/admin-shell";
import { requireAdminContext } from "@/features/admin/access";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const context = await requireAdminContext();

  return <AdminShell fullName={context.fullName}>{children}</AdminShell>;
}
