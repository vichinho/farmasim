"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useRef } from "react";
import type { Group, Mesh } from "three";

import type { WorkspaceArea } from "./scene-types";

export function SupportMonitor3D({ area }: { area: WorkspaceArea }) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-label={`Escena 3D de apoyo: ${areaLabel(area)}`} className="absolute inset-0" role="img">
      <Canvas
        camera={{ fov: 38, position: [0, 1.65, 5] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "low-power" }}
      >
        <color attach="background" args={["#c9dbd2"]} />
        <ambientLight intensity={1.7} />
        <directionalLight intensity={2.1} position={[-3, 5, 4]} />
        <pointLight color="#7ee7b1" intensity={area === "verification" ? 8 : 3} position={[2.45, 1.55, 1]} />
        <MonitorScene area={area} reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
}

function MonitorScene({ area, reduceMotion }: { area: WorkspaceArea; reduceMotion: boolean | null }) {
  const patientState = area === "service" ? "document" : area === "verification" ? "verify" : "waiting";

  return (
    <group position={[0, -1.25, 0]}>
      <mesh position={[0, 1.7, -1.35]} receiveShadow>
        <boxGeometry args={[5.8, 3.4, 0.18]} />
        <meshStandardMaterial color="#b7ccc1" roughness={0.9} />
      </mesh>
      <Drawers />
      <Counter />
      <VirtualPatient reduceMotion={reduceMotion} state={patientState} />
      <Terminal area={area} />
      <Beacon active={area === "verification" || area === "preparation"} reduceMotion={reduceMotion} />
      <FictionalDocument active={patientState === "document"} reduceMotion={reduceMotion} />
      <WindowLight />
    </group>
  );
}

function Drawers() {
  return (
    <group position={[1.55, 1.65, -1.15]}>
      <mesh>
        <boxGeometry args={[1.65, 2.4, 0.32]} />
        <meshStandardMaterial color="#446e63" roughness={0.7} />
      </mesh>
      {[0, 1, 2, 3].map((row) =>
        [0, 1].map((column) => (
          <mesh key={`${row}-${column}`} position={[-0.38 + column * 0.76, 0.8 - row * 0.54, 0.19]}>
            <boxGeometry args={[0.62, 0.37, 0.08]} />
            <meshStandardMaterial color="#efe7d9" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Counter() {
  return (
    <group>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[6.2, 0.48, 1.5]} />
        <meshStandardMaterial color="#9d6040" roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.37, 0.18]}>
        <boxGeometry args={[6.2, 0.6, 0.32]} />
        <meshStandardMaterial color="#274c49" roughness={0.85} />
      </mesh>
    </group>
  );
}

function VirtualPatient({ reduceMotion, state }: { reduceMotion: boolean | null; state: "document" | "verify" | "waiting" }) {
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!group.current || reduceMotion) return;
    const breathing = Math.sin(clock.elapsedTime * 1.35) * 0.025;
    group.current.position.y = 0.23 + breathing;
    group.current.rotation.z = state === "verify" ? Math.sin(clock.elapsedTime * 1.5) * 0.025 : 0;
  });

  return (
    <group ref={group} position={[-0.55, 0.23, -0.12]}>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.37, 24, 24]} />
        <meshStandardMaterial color="#b97858" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.57, 0.02]}>
        <sphereGeometry args={[0.39, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.53]} />
        <meshStandardMaterial color="#45352d" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.64, 0]}>
        <capsuleGeometry args={[0.5, 0.72, 8, 20]} />
        <meshStandardMaterial color="#657e71" roughness={0.8} />
      </mesh>
      <mesh position={[-0.42, 0.62, 0.28]} rotation={[0, 0, -0.25]}>
        <capsuleGeometry args={[0.09, 0.52, 6, 12]} />
        <meshStandardMaterial color="#b97858" roughness={0.72} />
      </mesh>
      <mesh position={[0.42, 0.62, 0.28]} rotation={[0, 0, state === "document" ? 0.34 : 0.16]}>
        <capsuleGeometry args={[0.09, 0.52, 6, 12]} />
        <meshStandardMaterial color="#b97858" roughness={0.72} />
      </mesh>
    </group>
  );
}

function Terminal({ area }: { area: WorkspaceArea }) {
  const systemActive = area === "system";
  return (
    <group position={[2.05, 0.72, 0.06]} rotation={[0, -0.2, 0]}>
      <mesh>
        <boxGeometry args={[1.05, 0.72, 0.14]} />
        <meshStandardMaterial color="#182a35" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[0.83, 0.5]} />
        <meshStandardMaterial color={systemActive ? "#8ee4c1" : "#d8eee3"} emissive={systemActive ? "#17775a" : "#315f55"} emissiveIntensity={systemActive ? 0.55 : 0.18} />
      </mesh>
      <mesh position={[0, -0.53, -0.02]}>
        <boxGeometry args={[0.15, 0.44, 0.12]} />
        <meshStandardMaterial color="#253947" />
      </mesh>
    </group>
  );
}

function Beacon({ active, reduceMotion }: { active: boolean; reduceMotion: boolean | null }) {
  const light = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!light.current || reduceMotion) return;
    const pulse = active ? 1 + Math.sin(clock.elapsedTime * 3) * 0.22 : 0.9 + Math.sin(clock.elapsedTime * 1.3) * 0.06;
    light.current.scale.setScalar(pulse);
  });

  return (
    <group position={[2.7, 0.64, 0.22]}>
      <mesh position={[0, -0.26, 0]}>
        <cylinderGeometry args={[0.19, 0.24, 0.12, 20]} />
        <meshStandardMaterial color="#162b2b" />
      </mesh>
      <mesh ref={light}>
        <cylinderGeometry args={[0.15, 0.15, 0.42, 20]} />
        <meshStandardMaterial color="#4ee49d" emissive="#1ab76e" emissiveIntensity={active ? 2.7 : 1.2} />
      </mesh>
    </group>
  );
}

function FictionalDocument({ active, reduceMotion }: { active: boolean; reduceMotion: boolean | null }) {
  const document = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!document.current || reduceMotion) return;
    document.current.position.x = active ? 0.12 + Math.sin(clock.elapsedTime * 1.2) * 0.05 : 0.12;
    document.current.rotation.z = active ? -0.11 + Math.sin(clock.elapsedTime * 1.2) * 0.035 : -0.11;
  });

  return (
    <group ref={document} position={[0.12, 0.45, 0.53]} rotation={[-Math.PI / 2, 0, -0.11]}>
      <mesh>
        <planeGeometry args={[0.86, 0.57]} />
        <meshStandardMaterial color="#fffdf3" roughness={0.82} />
      </mesh>
      <mesh position={[-0.12, 0.08, 0.01]}>
        <planeGeometry args={[0.42, 0.035]} />
        <meshStandardMaterial color="#14966d" />
      </mesh>
      <mesh position={[-0.08, -0.06, 0.01]}>
        <planeGeometry args={[0.48, 0.02]} />
        <meshStandardMaterial color="#b9c5c2" />
      </mesh>
    </group>
  );
}

function WindowLight() {
  return (
    <group position={[-2.2, 1.65, -1.2]}>
      <mesh>
        <boxGeometry args={[0.9, 1.45, 0.08]} />
        <meshStandardMaterial color="#d9eef1" emissive="#b9e8ed" emissiveIntensity={0.35} />
      </mesh>
    </group>
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
