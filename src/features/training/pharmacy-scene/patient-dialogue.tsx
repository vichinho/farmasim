"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { PatientAnimationState, PatientProfile } from "./scene-types";

export function PatientDialogue({
  dialogue,
  profile,
  state,
}: {
  dialogue: string;
  profile: PatientProfile;
  state: PatientAnimationState;
}) {
  const reduceMotion = useReducedMotion();
  const isVisible = state !== "hidden" && state !== "leaving";

  return (
    <AnimatePresence mode="wait">
      {isVisible ? (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute left-[4%] top-[22%] z-30 max-w-[56%] rounded-2xl rounded-bl-md border border-slate-900/80 bg-white/96 p-3 shadow-[0_10px_30px_rgb(19_33_60/.22)] backdrop-blur-sm sm:left-auto sm:right-[3%] sm:top-[24%] sm:max-w-[32%] sm:p-4"
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 5 }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
          key={dialogue}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-600" />
            <p className="text-[0.55rem] font-black tracking-[0.14em] text-emerald-800">{profile.turn} · PACIENTE</p>
          </div>
          <p className="mt-2 text-[0.68rem] font-semibold leading-5 text-slate-800 sm:text-sm sm:leading-6">{dialogue}</p>
          <span aria-hidden="true" className="absolute -bottom-2 left-5 size-4 rotate-45 border-b border-r border-slate-900/80 bg-white" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
