"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function OrientationGuard({ children }: { children: ReactNode }) {
  const [requiresLandscape, setRequiresLandscape] = useState(false);

  useEffect(() => {
    const update = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      setRequiresLandscape(coarsePointer && window.innerHeight > window.innerWidth);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (!requiresLandscape) return children;

  return (
    <div className="grid h-dvh w-screen place-items-center overflow-hidden bg-[#17131f] px-6 text-white">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-[1.7rem] border border-violet-300/30 bg-violet-400/10 text-4xl shadow-[0_24px_80px_rgba(109,40,217,.2)]">
          ↻
        </div>
        <p className="mt-7 text-xs font-black uppercase tracking-[0.24em] text-violet-300">FarmaSim 3D</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Gira tu dispositivo</h1>
        <p className="mt-4 text-sm font-semibold leading-6 text-white/65">
          La simulación utiliza orientación horizontal para mantener la experiencia completa, los controles y el campo de visión.
        </p>
      </div>
    </div>
  );
}
