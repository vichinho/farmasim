"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, Color, SRGBColorSpace, type Texture } from "three";

import { interactableUserData } from "@/features/farmasim-3d/interaction/interaction-system";

const BRAND = "#6f3cc3";
const DARK = "#2b2338";
const OFF_WHITE = "#f6f4f2";

export function PharmacyWorld() {
  return (
    <>
      <ambientLight intensity={0.88} />
      <directionalLight
        castShadow
        intensity={2.2}
        position={[4.5, 7.5, 3.5]}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      <pointLight intensity={5.5} position={[0, 2.75, 0.2]} distance={8} color="#fff7ed" />
      <pointLight intensity={3.2} position={[-4.2, 2.45, -2.8]} distance={5.5} color="#ede9fe" />
      <pointLight intensity={3.2} position={[4.2, 2.45, -2.8]} distance={5.5} color="#ede9fe" />

      <RoomShell />
      <RearWallModules />
      <FrontCounter />
      <PatientPlaceholder />
    </>
  );
}

function RoomShell() {
  return (
    <>
      <mesh receiveShadow position={[0, -0.05, -1.15]}>
        <boxGeometry args={[11.5, 0.1, 7.6]} />
        <meshStandardMaterial color="#d3d0cc" roughness={0.88} />
      </mesh>
      <mesh receiveShadow position={[0, 2.05, -4.94]}>
        <boxGeometry args={[11.5, 4.2, 0.12]} />
        <meshStandardMaterial color="#d6d2cd" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[-5.68, 2.05, -1.2]}>
        <boxGeometry args={[0.12, 4.2, 7.5]} />
        <meshStandardMaterial color="#d1ccc7" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[5.68, 2.05, -1.2]}>
        <boxGeometry args={[0.12, 4.2, 7.5]} />
        <meshStandardMaterial color="#d1ccc7" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, 4.08, -1.2]}>
        <boxGeometry args={[11.5, 0.08, 7.5]} />
        <meshStandardMaterial color="#c9c5c1" roughness={0.9} />
      </mesh>

      <CeilingPanel position={[-2.3, 4.01, -1.4]} />
      <CeilingPanel position={[0, 4.01, -1.4]} />
      <CeilingPanel position={[2.3, 4.01, -1.4]} />
    </>
  );
}

function CeilingPanel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.15, 0.5]} />
      <meshBasicMaterial color="#fffdf8" />
    </mesh>
  );
}

function RearWallModules() {
  return (
    <>
      <MedicationShelf position={[-3.65, 0, -4.62]} title="MEDICAMENTOS" />
      <ArsenalWall position={[0.2, 0, -4.65]} />
      <MedicationShelf position={[4.05, 0, -4.62]} title="CUIDADOS" />
    </>
  );
}

function MedicationShelf({ position, title }: { position: [number, number, number]; title: string }) {
  const titleTexture = useLabelTexture(title, 512, 96, "#f7f5f3", "#2e2b31", 40);

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[2.05, 3.05, 0.34]} />
        <meshStandardMaterial color="#eceae8" roughness={0.82} />
      </mesh>
      {[-0.95, -0.35, 0.25, 0.85].map((y) => (
        <mesh castShadow receiveShadow key={y} position={[0, y + 1.55, 0.24]}>
          <boxGeometry args={[1.9, 0.07, 0.58]} />
          <meshStandardMaterial color="#b9b5b1" roughness={0.75} />
        </mesh>
      ))}
      <mesh position={[0, 3.22, 0.2]}>
        <planeGeometry args={[1.76, 0.33]} />
        <meshBasicMaterial map={titleTexture ?? undefined} color={titleTexture ? "white" : "#f7f5f3"} />
      </mesh>
      {Array.from({ length: 15 }).map((_, index) => {
        const row = Math.floor(index / 5);
        const column = index % 5;
        const shades = ["#e8e4f5", "#d8dfea", "#ebe5dd", "#d9e5df", "#ded6e8"];
        return (
          <mesh
            castShadow
            key={index}
            position={[-0.72 + column * 0.36, 2.35 - row * 0.6, 0.44]}
          >
            <boxGeometry args={[0.25, 0.34, 0.24]} />
            <meshStandardMaterial color={shades[index % shades.length]} roughness={0.78} />
          </mesh>
        );
      })}
    </group>
  );
}

const drawerLabels = ["A-B", "C-D", "E-F", "G-H", "I-J", "K-L", "M-N", "O-P", "Q-R", "S-T", "U-V", "W-X", "Y-Z"];

function ArsenalWall({ position }: { position: [number, number, number] }) {
  const arsenalTexture = useLabelTexture("ARSENAL", 768, 120, BRAND, "#ffffff", 54);

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 2.95, 0.1]}>
        <boxGeometry args={[3.65, 0.66, 0.36]} />
        <meshStandardMaterial color={BRAND} roughness={0.62} />
      </mesh>
      <mesh position={[0, 2.97, 0.3]}>
        <planeGeometry args={[2.9, 0.42]} />
        <meshBasicMaterial map={arsenalTexture ?? undefined} color={arsenalTexture ? "white" : BRAND} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.28, 0]}>
        <boxGeometry args={[3.65, 2.8, 0.35]} />
        <meshStandardMaterial color="#a59f99" roughness={0.82} />
      </mesh>

      {drawerLabels.map((label, index) => {
        const row = Math.floor(index / 3);
        const column = index % 3;
        const isLast = index === drawerLabels.length - 1;
        const x = isLast ? -1.12 : -1.12 + column * 1.12;
        const y = 2.35 - row * 0.58;
        return <Drawer key={label} label={label} position={[x, y, 0.31]} />;
      })}
    </group>
  );
}

function Drawer({ label, position }: { label: string; position: [number, number, number] }) {
  const labelTexture = useLabelTexture(label, 256, 96, "#f4f2f0", "#29262d", 38);

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.92, 0.46, 0.52]} />
        <meshStandardMaterial color="#aaa49e" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.06, 0.275]}>
        <planeGeometry args={[0.58, 0.19]} />
        <meshBasicMaterial map={labelTexture ?? undefined} color={labelTexture ? "white" : "#f4f2f0"} />
      </mesh>
      <mesh castShadow position={[0, -0.13, 0.3]}>
        <boxGeometry args={[0.34, 0.06, 0.08]} />
        <meshStandardMaterial color="#403c3a" roughness={0.72} />
      </mesh>
    </group>
  );
}

function FrontCounter() {
  return (
    <group position={[0, 0, 1.8]}>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[6.4, 1.05, 0.95]} />
        <meshStandardMaterial color="#eceae8" roughness={0.82} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.12, 0]}>
        <boxGeometry args={[6.55, 0.12, 1.15]} />
        <meshStandardMaterial color="#faf9f7" roughness={0.72} />
      </mesh>
      <Computer />
      <Scanner />
    </group>
  );
}

function Computer() {
  const screenTexture = useLabelTexture("FARMASYS", 512, 288, "#16141b", "#a78bfa", 54);

  return (
    <group position={[-0.6, 1.52, -0.1]} {...interactableUserData({
      id: "clinical-terminal",
      label: "Usar computador",
      action: {
        type: "computer.focused",
        targetType: "computer",
        targetId: "clinical-terminal",
      },
    })}>
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[0.92, 0.64, 0.08]} />
        <meshStandardMaterial color="#17151b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.42, 0.045]}>
        <planeGeometry args={[0.79, 0.5]} />
        <meshBasicMaterial map={screenTexture ?? undefined} color={screenTexture ? "white" : "#16141b"} />
      </mesh>
      <mesh castShadow position={[0, 0.01, 0]}>
        <boxGeometry args={[0.12, 0.35, 0.08]} />
        <meshStandardMaterial color="#2a272d" roughness={0.58} />
      </mesh>
      <mesh castShadow position={[0, -0.18, 0]}>
        <boxGeometry args={[0.62, 0.06, 0.34]} />
        <meshStandardMaterial color="#26242a" roughness={0.62} />
      </mesh>
    </group>
  );
}

function Scanner() {
  return (
    <group position={[0.45, 1.29, -0.18]} rotation={[0, -0.15, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.18, 0.32, 0.18]} />
        <meshStandardMaterial color="#f5f3f0" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0, -0.2, 0]}>
        <boxGeometry args={[0.28, 0.08, 0.28]} />
        <meshStandardMaterial color="#2f2c33" roughness={0.62} />
      </mesh>
    </group>
  );
}

function PatientPlaceholder() {
  return (
    <group position={[-3.6, 0, 2.7]} {...interactableUserData({
      id: "current-patient",
      label: "Hablar con paciente",
      action: {
        type: "document.requested",
        targetType: "patient",
      },
    })}>
      <mesh castShadow position={[0, 2.08, 0]}>
        <sphereGeometry args={[0.29, 20, 14]} />
        <meshStandardMaterial color="#d7b89b" roughness={0.86} />
      </mesh>
      <mesh castShadow position={[0, 1.32, 0]}>
        <cylinderGeometry args={[0.39, 0.48, 1.18, 18]} />
        <meshStandardMaterial color="#cbbba9" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[-0.16, 0.48, 0]}>
        <cylinderGeometry args={[0.09, 0.105, 0.76, 12]} />
        <meshStandardMaterial color="#3c3940" roughness={0.78} />
      </mesh>
      <mesh castShadow position={[0.16, 0.48, 0]}>
        <cylinderGeometry args={[0.09, 0.105, 0.76, 12]} />
        <meshStandardMaterial color="#3c3940" roughness={0.78} />
      </mesh>
    </group>
  );
}

function useLabelTexture(
  label: string,
  width: number,
  height: number,
  background: string,
  foreground: string,
  fontSize: number,
) {
  const texture = useMemo<Texture | null>(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = foreground;
    context.font = `800 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, width / 2, height / 2 + 2);

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.needsUpdate = true;
    return nextTexture;
  }, [background, fontSize, foreground, height, label, width]);

  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

export const pharmacyWorldColors = {
  brand: new Color(BRAND),
};