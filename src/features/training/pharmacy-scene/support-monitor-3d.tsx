"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useRef } from "react";
import { AdditiveBlending, TextureLoader, type Group, type Mesh } from "three";

import type { WorkspaceArea } from "./scene-types";

export function SupportMonitor3D({ area }: { area: WorkspaceArea }) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-label={`Escena 3D de apoyo: ${areaLabel(area)}`} className="absolute inset-0" role="img">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 36 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={1.4} />
        <MonitorScene area={area} reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
}

function MonitorScene({ area, reduceMotion }: { area: WorkspaceArea; reduceMotion: boolean | null }) {
  const texture = useLoader(TextureLoader, "/scenes/support-monitor-3d-v1.png");

  return (
    <group>
      <mesh>
        <planeGeometry args={[5.75, 3.59]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <DocumentGlow active={area === "service" || area === "system"} reduceMotion={reduceMotion} />
      <BeaconGlow active={area === "preparation" || area === "verification"} reduceMotion={reduceMotion} />
      <StationTint area={area} reduceMotion={reduceMotion} />
    </group>
  );
}

function DocumentGlow({ active, reduceMotion }: { active: boolean; reduceMotion: boolean | null }) {
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!group.current || reduceMotion) return;
    const float = active ? Math.sin(clock.elapsedTime * 1.8) * 0.04 : 0;
    group.current.position.y = -1.14 + float;
    group.current.rotation.z = -0.13 + float * 0.65;
  });

  return (
    <group ref={group} position={[-0.95, -1.14, 0.06]} rotation={[0, 0, -0.13]}>
      <mesh>
        <planeGeometry args={[1.18, 0.22]} />
        <meshBasicMaterial blending={AdditiveBlending} color="#4ee8ad" opacity={active ? 0.34 : 0.12} transparent />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <planeGeometry args={[0.86, 0.025]} />
        <meshBasicMaterial color="#5cf1b9" opacity={active ? 0.82 : 0.28} transparent />
      </mesh>
    </group>
  );
}

function BeaconGlow({ active, reduceMotion }: { active: boolean; reduceMotion: boolean | null }) {
  const glow = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!glow.current || reduceMotion) return;
    const pulse = active ? 1 + Math.sin(clock.elapsedTime * 3.2) * 0.24 : 0.9 + Math.sin(clock.elapsedTime) * 0.06;
    glow.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={glow} position={[2.08, -0.93, 0.05]}>
      <circleGeometry args={[0.31, 32]} />
      <meshBasicMaterial blending={AdditiveBlending} color="#57f3a8" opacity={active ? 0.55 : 0.24} transparent />
    </mesh>
  );
}

function StationTint({ area, reduceMotion }: { area: WorkspaceArea; reduceMotion: boolean | null }) {
  const overlay = useRef<Mesh>(null);
  const color = area === "storage" ? "#fbbf24" : area === "verification" ? "#34d399" : "#60a5fa";

  useFrame(({ clock }) => {
    if (!overlay.current || reduceMotion) return;
    const material = overlay.current.material;
    if ("opacity" in material) material.opacity = 0.035 + Math.sin(clock.elapsedTime * 1.4) * 0.012;
  });

  return (
    <mesh ref={overlay} position={[0, 0, 0.02]}>
      <planeGeometry args={[5.75, 3.59]} />
      <meshBasicMaterial color={color} opacity={0.035} transparent />
    </mesh>
  );
}

function areaLabel(area: WorkspaceArea) {
  const labels: Record<WorkspaceArea, string> = {
    service: "atención",
    system: "sistema",
    storage: "gavetas",
    preparation: "preparación",
    verification: "verificación",
  };
  return labels[area];
}
