"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";

import { SimulationHud } from "@/features/farmasim-3d/hud/simulation-hud";
import {
  FirstPersonPlayer,
  type PlayerInputState,
} from "@/features/farmasim-3d/player/first-person-player";
import { MobileControls } from "@/features/farmasim-3d/responsive/mobile-controls";
import { OrientationGuard } from "@/features/farmasim-3d/responsive/orientation-guard";
import { PharmacyWorld } from "@/features/farmasim-3d/world/pharmacy-world";

export function FarmaSim3DExperience() {
  const inputRef = useRef<PlayerInputState>({
    moveX: 0,
    moveY: 0,
    lookX: 0,
    lookY: 0,
    interact: false,
  });

  return (
    <OrientationGuard>
      <main className="relative h-dvh w-screen overflow-hidden bg-[#17131f]" style={{ touchAction: "none" }}>
        <Canvas
          camera={{ fov: 64, near: 0.08, far: 40, position: [0, 1.62, 0.15] }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          shadows
        >
          <color attach="background" args={["#cfc8c0"]} />
          <fog attach="fog" args={["#cfc8c0", 10, 22]} />
          <PharmacyWorld />
          <FirstPersonPlayer inputRef={inputRef} />
        </Canvas>

        <SimulationHud />
        <MobileControls inputRef={inputRef} />
      </main>
    </OrientationGuard>
  );
}
