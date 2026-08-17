import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FarmaSim3DExperience } from "@/features/farmasim-3d/core/farmasim-3d-experience";

export const metadata: Metadata = {
  title: "FarmaSim 3D · Desarrollo local",
  description: "Playground local para la reconstrucción greenfield de la experiencia 3D.",
};

export default function FarmaSim3DDevelopmentPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <FarmaSim3DExperience />;
}
