"use client";

import type { MutableRefObject, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

import type { PlayerInputState } from "@/features/farmasim-3d/player/first-person-player";

type Props = {
  inputRef: MutableRefObject<PlayerInputState>;
};

type Point = { x: number; y: number };

const JOYSTICK_RADIUS = 46;

export function MobileControls({ inputRef }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [knob, setKnob] = useState<Point>({ x: 0, y: 0 });
  const joystickPointer = useRef<number | null>(null);
  const joystickOrigin = useRef<Point>({ x: 0, y: 0 });
  const lookPointer = useRef<number | null>(null);
  const lookLast = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  if (!enabled) return null;

  const startJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    joystickPointer.current = event.pointerId;
    joystickOrigin.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointer.current !== event.pointerId) return;

    const dx = event.clientX - joystickOrigin.current.x;
    const dy = event.clientY - joystickOrigin.current.y;
    const distance = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, JOYSTICK_RADIUS / distance);
    const x = dx * scale;
    const y = dy * scale;

    setKnob({ x, y });
    inputRef.current.moveX = x / JOYSTICK_RADIUS;
    inputRef.current.moveY = -y / JOYSTICK_RADIUS;
  };

  const stopJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointer.current !== event.pointerId) return;
    joystickPointer.current = null;
    inputRef.current.moveX = 0;
    inputRef.current.moveY = 0;
    setKnob({ x: 0, y: 0 });
  };

  const startLook = (event: ReactPointerEvent<HTMLDivElement>) => {
    lookPointer.current = event.pointerId;
    lookLast.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveLook = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointer.current !== event.pointerId) return;
    const dx = event.clientX - lookLast.current.x;
    const dy = event.clientY - lookLast.current.y;
    lookLast.current = { x: event.clientX, y: event.clientY };
    inputRef.current.lookX += dx;
    inputRef.current.lookY += dy;
  };

  const stopLook = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (lookPointer.current !== event.pointerId) return;
    lookPointer.current = null;
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-40 select-none" style={{ touchAction: "none" }}>
      <div
        aria-label="Mover personaje"
        className="pointer-events-auto absolute bottom-5 left-5 grid size-28 place-items-center rounded-full border border-white/20 bg-black/35 shadow-2xl backdrop-blur-md"
        onPointerDown={startJoystick}
        onPointerMove={moveJoystick}
        onPointerUp={stopJoystick}
        onPointerCancel={stopJoystick}
      >
        <div
          className="grid size-12 place-items-center rounded-full border border-white/25 bg-white/20 shadow-lg"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        >
          <span className="text-sm font-black text-white/90">+</span>
        </div>
      </div>

      <div
        aria-label="Mover cámara"
        className="pointer-events-auto absolute bottom-0 right-0 top-16 w-[48%]"
        onPointerDown={startLook}
        onPointerMove={moveLook}
        onPointerUp={stopLook}
        onPointerCancel={stopLook}
      />

      <button
        className="pointer-events-auto absolute bottom-7 right-7 grid size-20 place-items-center rounded-full border border-violet-300/40 bg-[#231a31]/90 text-center text-xs font-black uppercase tracking-[0.08em] text-white shadow-[0_16px_45px_rgba(76,29,149,.35)] backdrop-blur-md active:scale-95"
        onPointerDown={() => {
          inputRef.current.interact = true;
        }}
        onPointerUp={() => {
          inputRef.current.interact = false;
        }}
        onPointerCancel={() => {
          inputRef.current.interact = false;
        }}
        type="button"
      >
        <span>
          E
          <span className="mt-1 block text-[0.58rem] tracking-[0.12em] text-violet-200">usar</span>
        </span>
      </button>
    </div>
  );
}
