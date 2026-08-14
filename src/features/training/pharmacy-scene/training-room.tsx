"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import type { PatientAnimationState } from "./scene-types";

const movement: Record<PatientAnimationState, { opacity: number; scale: number; x: string; y: number }> = {
  hidden: { opacity: 0, scale: 0.92, x: "-20%", y: 18 },
  entering: { opacity: 1, scale: 1, x: "0%", y: 0 },
  approaching: { opacity: 1, scale: 1.015, x: "0%", y: -2 },
  idle: { opacity: 1, scale: 1, x: "0%", y: 0 },
  speaking: { opacity: 1, scale: 1.01, x: "0%", y: -3 },
  "handing-document": { opacity: 1, scale: 1.025, x: "0%", y: -8 },
  waiting: { opacity: 1, scale: 1, x: "0%", y: 0 },
  "positive-reaction": { opacity: 1, scale: 1.015, x: "0%", y: -4 },
  "concerned-reaction": { opacity: 1, scale: 0.99, x: "0%", y: 2 },
  leaving: { opacity: 0, scale: 0.94, x: "26%", y: 20 },
};

export function TrainingRoom({
  sceneState,
  status,
}: {
  sceneState: PatientAnimationState;
  status: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-label={`Escena de farmacia: ${status}`} className="absolute inset-0" role="img">
      <Image
        alt=""
        className="object-cover"
        fill
        priority
        sizes="(max-width: 1280px) 100vw, 62vw"
        src="/scenes/pharmacy-training-room-v3.png"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,transparent_15%,rgb(12_31_35/.12)_100%)]" />
      <motion.div
        animate={reduceMotion ? { opacity: sceneState === "hidden" || sceneState === "leaving" ? 0 : 1 } : movement[sceneState]}
        className="absolute bottom-[-17%] left-1/2 z-10 w-[57%] min-w-64 max-w-[34rem] -translate-x-1/2 drop-shadow-[0_24px_20px_rgb(34_24_16/.34)] sm:bottom-[-14%]"
        initial={false}
        transition={{ duration: sceneState === "entering" || sceneState === "leaving" ? 0.75 : 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
          transition={{ duration: 4.2, ease: "easeInOut", repeat: Infinity }}
        >
          <Image
            alt="Paciente virtual adulto"
            className="h-auto w-full select-none"
            draggable={false}
            height={1536}
            priority
            sizes="(max-width: 640px) 64vw, (max-width: 1280px) 50vw, 34rem"
            src="/scenes/patient-a01-3d-render-v3.png"
            width={1024}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
