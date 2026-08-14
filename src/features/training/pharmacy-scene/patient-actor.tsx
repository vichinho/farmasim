"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import type { PatientAnimationState, PatientProfile } from "./scene-types";

type PatientActorProps = {
  profile: PatientProfile;
  state: PatientAnimationState;
};

const actorTargets: Record<PatientAnimationState, { opacity: number; rotate: number; scale: number; x: string; y: number }> = {
  hidden: { opacity: 0, rotate: -2, scale: 0.88, x: "-130%", y: 22 },
  entering: { opacity: 1, rotate: 0, scale: 1, x: "0%", y: 0 },
  approaching: { opacity: 1, rotate: 0, scale: 1.02, x: "0%", y: 0 },
  idle: { opacity: 1, rotate: 0, scale: 1, x: "0%", y: 0 },
  speaking: { opacity: 1, rotate: 0, scale: 1.01, x: "0%", y: -2 },
  "handing-document": { opacity: 1, rotate: -0.5, scale: 1.035, x: "0%", y: -8 },
  waiting: { opacity: 1, rotate: 0, scale: 1, x: "0%", y: 0 },
  "positive-reaction": { opacity: 1, rotate: -0.8, scale: 1.015, x: "0%", y: -5 },
  "concerned-reaction": { opacity: 1, rotate: 0.8, scale: 0.99, x: "0%", y: 2 },
  leaving: { opacity: 0, rotate: 2, scale: 0.92, x: "135%", y: 20 },
};

export function PatientActor({ profile, state }: PatientActorProps) {
  const reduceMotion = useReducedMotion();
  const visible = state !== "hidden" && state !== "leaving";
  const documentActive = state === "handing-document";

  return (
    <motion.div
      animate={reduceMotion ? { opacity: visible ? 1 : 0 } : actorTargets[state]}
      aria-label={`${profile.name}, ${patientStateLabel(state)}`}
      className="absolute bottom-[-2%] left-1/2 z-20 w-[58%] min-w-64 max-w-[31rem] -translate-x-1/2 sm:bottom-[2%] sm:w-[42%]"
      initial={false}
      role="img"
      transition={{ duration: state === "entering" || state === "leaving" ? 0.85 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: state === "speaking" ? [0, -3, 0] : [0, -1.5, 0] }}
        className={cn(
          "relative drop-shadow-[0_22px_18px_rgb(35_24_16/.34)]",
          state === "concerned-reaction" && "brightness-[0.96] saturate-[0.88]",
          state === "positive-reaction" && "brightness-[1.04] saturate-[1.05]",
        )}
        transition={{ duration: state === "speaking" ? 1.25 : 4, ease: "easeInOut", repeat: Infinity }}
      >
        <Image
          alt=""
          className="h-auto w-full select-none"
          draggable={false}
          height={profile.imageHeight}
          priority
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 46vw, 34rem"
          src={profile.imageSrc}
          width={profile.imageWidth}
        />
        <motion.span
          animate={documentActive && !reduceMotion ? { opacity: [0.25, 0.7, 0.25], scale: [0.96, 1.05, 0.96] } : { opacity: 0 }}
          aria-hidden="true"
          className="absolute bottom-[4%] left-[16%] h-[22%] w-[32%] rounded-xl border-2 border-amber-200 bg-amber-100/20 shadow-[0_0_30px_rgb(253_230_138/.75)]"
          transition={{ duration: 1.5, repeat: documentActive ? Infinity : 0 }}
        />
      </motion.div>
    </motion.div>
  );
}

function patientStateLabel(state: PatientAnimationState) {
  const labels: Record<PatientAnimationState, string> = {
    hidden: "esperando fuera del puesto",
    entering: "ingresando a la ventanilla",
    approaching: "acercándose a la ventanilla",
    idle: "en espera",
    speaking: "hablando",
    "handing-document": "entregando una solicitud ficticia",
    waiting: "esperando una revisión",
    "positive-reaction": "con reacción positiva",
    "concerned-reaction": "con expresión de preocupación",
    leaving: "saliendo de la ventanilla",
  };
  return labels[state];
}
