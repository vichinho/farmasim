"use client";

import { motion, useReducedMotion } from "motion/react";

import type { PatientAnimationState, PatientProfile } from "./scene-types";

type PatientActorProps = {
  profile: PatientProfile;
  state: PatientAnimationState;
};

const actorTargets: Record<PatientAnimationState, { opacity: number; scale: number; x: number; y: number }> = {
  hidden: { opacity: 0, scale: 0.94, x: -180, y: 28 },
  entering: { opacity: 1, scale: 1, x: 0, y: 0 },
  approaching: { opacity: 1, scale: 1, x: 0, y: 0 },
  idle: { opacity: 1, scale: 1, x: 0, y: 0 },
  speaking: { opacity: 1, scale: 1, x: 0, y: 0 },
  "handing-document": { opacity: 1, scale: 1, x: 0, y: 0 },
  waiting: { opacity: 1, scale: 1, x: 0, y: 0 },
  "positive-reaction": { opacity: 1, scale: 1, x: 0, y: -3 },
  "concerned-reaction": { opacity: 1, scale: 1, x: 0, y: 2 },
  leaving: { opacity: 0, scale: 0.96, x: 190, y: 18 },
};

export function PatientActor({ profile, state }: PatientActorProps) {
  const reduceMotion = useReducedMotion();
  const isSpeaking = state === "speaking" || state === "entering";
  const isConcerned = state === "concerned-reaction";
  const isPositive = state === "positive-reaction";
  const handsDocument = state === "handing-document";
  const breath = reduceMotion ? undefined : { y: [0, -2, 0] };

  return (
    <motion.div
      animate={reduceMotion ? { opacity: state === "hidden" || state === "leaving" ? 0 : 1 } : actorTargets[state]}
      aria-label={`${profile.name}, ${patientStateLabel(state)}`}
      className="absolute bottom-[-5%] left-1/2 z-20 w-[47%] min-w-56 max-w-[25rem] -translate-x-1/2"
      initial={false}
      role="img"
      transition={{ duration: state === "entering" || state === "leaving" ? 0.75 : 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.svg
        animate={breath}
        aria-hidden="true"
        className="h-auto w-full overflow-visible drop-shadow-[0_18px_18px_rgb(21_40_33/0.24)]"
        fill="none"
        initial={false}
        transition={{ duration: 3.8, ease: "easeInOut", repeat: Infinity }}
        viewBox="0 0 420 500"
      >
        <defs>
          <linearGradient id={`${profile.id}-coat`} x1="70" x2="340" y1="265" y2="486" gradientUnits="userSpaceOnUse">
            <stop stopColor={profile.coat} />
            <stop offset="1" stopColor="#60412f" />
          </linearGradient>
          <linearGradient id={`${profile.id}-skin`} x1="165" x2="255" y1="72" y2="246" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e0ad82" />
            <stop offset="1" stopColor={profile.skin} />
          </linearGradient>
          <filter id={`${profile.id}-soft-shadow`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" floodColor="#1f2d29" floodOpacity="0.22" stdDeviation="5" />
          </filter>
        </defs>

        <motion.g
          animate={isPositive && !reduceMotion ? { rotate: [0, -1.5, 0] } : isConcerned ? { rotate: -1 } : { rotate: 0 }}
          initial={false}
          style={{ originX: "210px", originY: "245px" }}
          transition={{ duration: 0.45 }}
        >
          <path d="M127 292C84 309 56 359 49 500H371C364 358 337 309 293 292L250 273H170L127 292Z" fill={`url(#${profile.id}-coat)`} stroke="#463127" strokeWidth="5" />
          <path d="M165 277L210 318L255 277L273 294L249 495H171L148 294L165 277Z" fill={profile.accent} stroke="#29443c" strokeWidth="4" />
          <path d="M184 280L210 313L236 280L232 263H188L184 280Z" fill={profile.shirt} stroke="#465968" strokeWidth="4" />
          <path d="M183 282L210 314L193 337L166 281L183 282Z" fill="#f2f4ef" stroke="#53615e" strokeWidth="3" />
          <path d="M237 282L210 314L227 337L254 281L237 282Z" fill="#f2f4ef" stroke="#53615e" strokeWidth="3" />
          <path d="M126 294L164 281L181 500H88L98 355L126 294Z" fill={`url(#${profile.id}-coat)`} opacity="0.96" />
          <path d="M294 294L256 281L239 500H332L322 355L294 294Z" fill={`url(#${profile.id}-coat)`} opacity="0.96" />
          <path d="M112 321C94 347 85 384 81 440" stroke="#d3a175" strokeOpacity="0.38" strokeWidth="5" strokeLinecap="round" />
          <path d="M307 321C324 347 334 384 338 440" stroke="#d3a175" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
          <path d="M210 322V489" stroke="#29463e" strokeWidth="3" strokeDasharray="3 11" />
          <circle cx="210" cy="368" r="4" fill="#d7c1a1" />
          <circle cx="210" cy="415" r="4" fill="#d7c1a1" />
        </motion.g>

        <motion.g
          animate={isPositive && !reduceMotion ? { y: [0, -4, 0] } : isConcerned ? { y: 2 } : { y: 0 }}
          initial={false}
          transition={{ duration: 0.5 }}
        >
          <path d="M177 243H243V286C243 307 177 307 177 286V243Z" fill={`url(#${profile.id}-skin)`} stroke="#744d39" strokeWidth="4" />
          <ellipse cx="210" cy="166" fill={`url(#${profile.id}-skin)`} rx="91" ry="106" stroke="#704b39" strokeWidth="5" />
          <ellipse cx="120" cy="174" fill={profile.skin} rx="14" ry="24" stroke="#704b39" strokeWidth="4" />
          <ellipse cx="300" cy="174" fill={profile.skin} rx="14" ry="24" stroke="#704b39" strokeWidth="4" />

          <path d="M128 140C124 79 156 44 210 44C263 44 299 81 292 143C280 117 269 102 251 89C220 105 178 107 143 92C135 107 130 123 128 140Z" fill={profile.hair} stroke="#655f58" strokeWidth="5" />
          <path d="M137 103C154 68 177 58 201 57M163 93C191 65 217 58 244 70M213 82C243 68 266 82 282 107" stroke="#f5f1e9" strokeWidth="7" strokeLinecap="round" opacity="0.72" />

          <motion.g
            animate={reduceMotion ? undefined : { scaleY: [1, 1, 1, 0.08, 1, 1] }}
            initial={false}
            style={{ originY: "166px" }}
            transition={{ duration: 4.8, repeat: Infinity, times: [0, 0.68, 0.75, 0.78, 0.82, 1] }}
          >
            <ellipse cx="176" cy="166" fill="#fff" rx="18" ry="11" />
            <ellipse cx="244" cy="166" fill="#fff" rx="18" ry="11" />
            <circle cx="178" cy="166" r="6.5" fill="#37433f" />
            <circle cx="242" cy="166" r="6.5" fill="#37433f" />
            <circle cx="180" cy="164" r="2" fill="#fff" />
            <circle cx="244" cy="164" r="2" fill="#fff" />
          </motion.g>

          <motion.path animate={isConcerned ? { rotate: -8, y: -2 } : { rotate: 0, y: 0 }} d="M156 145C169 137 182 137 194 143" stroke="#57483e" strokeWidth="6" strokeLinecap="round" style={{ originX: "175px", originY: "143px" }} />
          <motion.path animate={isConcerned ? { rotate: 8, y: -2 } : { rotate: 0, y: 0 }} d="M226 143C238 137 251 137 264 145" stroke="#57483e" strokeWidth="6" strokeLinecap="round" style={{ originX: "245px", originY: "143px" }} />

          <rect x="146" y="146" width="57" height="39" rx="17" stroke="#3d4848" strokeWidth="5" />
          <rect x="217" y="146" width="57" height="39" rx="17" stroke="#3d4848" strokeWidth="5" />
          <path d="M203 160H217" stroke="#3d4848" strokeWidth="5" />
          <path d="M146 157L126 151M274 157L294 151" stroke="#3d4848" strokeWidth="5" strokeLinecap="round" />

          <path d="M210 168C202 188 199 200 209 204C215 205 220 203 224 201" stroke="#865943" strokeWidth="4" strokeLinecap="round" />
          <path d="M173 218C188 207 232 207 247 218C235 219 225 225 210 225C195 225 185 219 173 218Z" fill="#d7d2c8" stroke="#5a514d" strokeWidth="4" />
          <path d="M182 226C194 237 226 237 238 226C234 252 188 252 182 226Z" fill="#d7d2c8" stroke="#5a514d" strokeWidth="4" />
          <motion.path
            animate={isSpeaking && !reduceMotion ? { d: ["M192 226C202 233 218 233 228 226", "M194 228C203 240 218 240 226 228", "M192 226C202 233 218 233 228 226"] } : isPositive ? { d: "M190 226C202 240 220 240 232 226" } : isConcerned ? { d: "M194 235C204 228 216 228 226 235" } : { d: "M192 229C202 234 218 234 228 229" }}
            fill={isSpeaking ? "#79463f" : "none"}
            stroke="#70443e"
            strokeLinecap="round"
            strokeWidth="4"
            transition={{ duration: 0.7, repeat: isSpeaking && !reduceMotion ? Infinity : 0 }}
          />
          <path d="M156 195C160 204 166 209 176 211M264 195C260 204 254 209 244 211" stroke="#a97054" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
        </motion.g>

        <motion.g
          animate={handsDocument ? { rotate: -7, x: -18, y: -38 } : { rotate: 0, x: 0, y: 0 }}
          initial={false}
          style={{ originX: "123px", originY: "340px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <path d="M132 318C102 338 83 375 73 429L118 443C127 410 143 384 164 365L132 318Z" fill={profile.coat} stroke="#55382b" strokeWidth="5" />
          <path d="M78 422C61 430 59 449 72 461C86 474 114 468 123 449L118 432L78 422Z" fill={`url(#${profile.id}-skin)`} stroke="#714a38" strokeWidth="4" />
          {handsDocument ? (
            <motion.g initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} filter={`url(#${profile.id}-soft-shadow)`}>
              <path d="M34 371L168 356L183 442L49 458L34 371Z" fill="#fffdf1" stroke="#53615e" strokeWidth="4" />
              <path d="M51 388L106 382" stroke="#2d7b61" strokeWidth="7" strokeLinecap="round" />
              <path d="M51 406L159 394M54 419L142 408M57 433L126 424" stroke="#c7cfca" strokeWidth="5" strokeLinecap="round" />
              <rect x="130" y="419" width="34" height="13" rx="3" fill="#e6efe9" stroke="#2d7b61" strokeWidth="2" />
            </motion.g>
          ) : null}
        </motion.g>

        <motion.g
          animate={isPositive && !reduceMotion ? { rotate: [0, 4, 0] } : { rotate: 0 }}
          initial={false}
          style={{ originX: "296px", originY: "365px" }}
          transition={{ duration: 0.7 }}
        >
          <path d="M288 317C316 337 336 374 347 429L302 443C292 407 277 383 256 365L288 317Z" fill={profile.coat} stroke="#55382b" strokeWidth="5" />
          <path d="M342 421C359 429 362 449 349 461C335 474 307 468 298 449L303 432L342 421Z" fill={`url(#${profile.id}-skin)`} stroke="#714a38" strokeWidth="4" />
        </motion.g>
      </motion.svg>
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
