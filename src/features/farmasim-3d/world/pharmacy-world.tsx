"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, Color, SRGBColorSpace, type Texture } from "three";

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
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.6]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#d9d4ce" roughness={0.84} />
      </mesh>

      <mesh receiveShadow position={[0, 1.75, -4.8]}>
        <boxGeometry args={[12, 3.5, 0.16]} />
        <meshStandardMaterial color="#e9e4df" roughness={0.92} />
      </mesh>

      <mesh receiveShadow position={[-5.92, 1.75, -0.55]}>
        <boxGeometry args={[0.16, 3.5, 8.7]} />
        <meshStandardMaterial color="#ddd7d1" roughness={0.95} />
      </mesh>

      <mesh receiveShadow position={[5.92, 1.75, -0.55]}>
        <boxGeometry args={[0.16, 3.5, 8.7]} />
        <meshStandardMaterial color="#ddd7d1" roughness={0.95} />
      </mesh>

      <mesh receiveShadow position={[0, 3.45, -0.55]}>
        <boxGeometry args={[12, 0.12, 8.7]} />
        <meshStandardMaterial color="#f8f6f3" roughness={0.92} />
      </mesh>

      {[-3.8, 0, 3.8].map((x) => (
        <mesh key={x} position={[x, 3.37, -0.2]}>
          <boxGeometry args={[1.85, 0.04, 0.72]} />
          <meshStandardMaterial color="#fffef9" emissive="#fff7e8" emissiveIntensity={1.35} />
        </mesh>
      ))}
    </group>
  );
}

function RearWallModules() {
  return (
    <group>
      <SectionSign label="MEDICAMENTOS" position={[-3.72, 2.9, -3.92]} />
      <SectionSign label="ARSENAL" position={[0, 2.9, -3.92]} accent />
      <SectionSign label="CUIDADOS" position={[3.72, 2.9, -3.92]} />

      <ShelfBay position={[-3.72, 0, -4.18]} />
      <DrawerBay position={[0, 0, -4.2]} />
      <ShelfBay position={[3.72, 0, -4.18]} mirrored />
    </group>
  );
}

function ShelfBay({ position, mirrored = false }: { position: [number, number, number]; mirrored?: boolean }) {
  const boxes = useMemo(() => {
    const items: { x: number; y: number; color: string; scale: number }[] = [];
    const palette = mirrored
      ? ["#eee8ff", "#d6c7ff", "#f4eee8", "#d9e8e2", "#e8d6ef"]
      : ["#f2ece7", "#d6e5ef", "#e9d8ba", "#e2d3ef", "#d8e8dd"];

    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        items.push({
          x: -1.2 + column * 0.34,
          y: 0.62 + row * 0.52,
          color: palette[(row * 3 + column) % palette.length],
          scale: column % 3 === 0 ? 1.08 : column % 4 === 0 ? 0.84 : 0.96,
        });
      }
    }

    return items;
  }, [mirrored]);

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 1.48, 0]}>
        <boxGeometry args={[3.22, 2.88, 0.58]} />
        <meshStandardMaterial color="#d8d2cc" roughness={0.76} />
      </mesh>

      <mesh position={[0, 1.48, 0.31]}>
        <boxGeometry args={[3.02, 2.66, 0.07]} />
        <meshStandardMaterial color="#f2efec" roughness={0.88} />
      </mesh>

      {[0.5, 1.02, 1.54, 2.06, 2.58].map((y) => (
        <mesh key={y} castShadow position={[0, y, 0.38]}>
          <boxGeometry args={[3.03, 0.055, 0.48]} />
          <meshStandardMaterial color="#bdb5ad" roughness={0.78} />
        </mesh>
      ))}

      {boxes.map((box, index) => (
        <mesh key={index} castShadow position={[box.x, box.y, 0.5]} scale={[box.scale, 1, 1]}>
          <boxGeometry args={[0.24, 0.28, 0.18]} />
          <meshStandardMaterial color={box.color} roughness={0.67} />
        </mesh>
      ))}
    </group>
  );
}

function DrawerBay({ position }: { position: [number, number, number] }) {
  const labels = [
    "A-B", "C-D", "E-F",
    "G-H", "I-J", "K-L",
    "M-N", "O-P", "Q-R",
    "S-T", "U-V", "W-X",
    "Y-Z", "", "",
  ];

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 1.48, 0]}>
        <boxGeometry args={[3.24, 2.88, 0.66]} />
        <meshStandardMaterial color="#bfb6ae" roughness={0.8} />
      </mesh>

      {labels.map((label, index) => {
        const row = Math.floor(index / 3);
        const column = index % 3;
        const x = -1.02 + column * 1.02;
        const y = 2.48 - row * 0.5;

        if (!label) return null;

        return (
          <group key={label} position={[x, y, 0.39]}>
            <mesh castShadow>
              <boxGeometry args={[0.91, 0.4, 0.12]} />
              <meshStandardMaterial color="#a99f97" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.08, 0.075]}>
              <boxGeometry args={[0.34, 0.035, 0.05]} />
              <meshStandardMaterial color="#655b55" metalness={0.22} roughness={0.55} />
            </mesh>
            <DrawerLabel label={label} />
          </group>
        );
      })}
    </group>
  );
}

function DrawerLabel({ label }: { label: string }) {
  const texture = useLabelTexture(label, 360, 140, "#f0ece8", "#3d3547", 64);
  if (!texture) return null;

  return (
    <mesh position={[0, 0.065, 0.071]}>
      <planeGeometry args={[0.52, 0.16]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

function SectionSign({
  label,
  position,
  accent = false,
}: {
  label: string;
  position: [number, number, number];
  accent?: boolean;
}) {
  const texture = useLabelTexture(
    label,
    960,
    200,
    accent ? BRAND : "#eee9e5",
    accent ? "#ffffff" : DARK,
    72,
  );

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[3.24, 0.54, 0.14]} />
        <meshStandardMaterial color={accent ? BRAND : OFF_WHITE} roughness={0.72} />
      </mesh>
      {texture ? (
        <mesh position={[0, 0, 0.076]}>
          <planeGeometry args={[2.72, 0.38]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      ) : null}
    </group>
  );
}

function FrontCounter() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.53, 1.46]}>
        <boxGeometry args={[9.3, 1.02, 0.78]} />
        <meshStandardMaterial color="#d4cec8" roughness={0.8} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 1.08, 1.46]}>
        <boxGeometry args={[9.55, 0.13, 0.92]} />
        <meshStandardMaterial color="#f2efed" roughness={0.62} />
      </mesh>

      <ComputerStation />
    </group>
  );
}

function ComputerStation() {
  return (
    <group position={[-2.35, 1.12, 1.03]}>
      <mesh castShadow position={[0, 0.66, 0]}>
        <boxGeometry args={[1.72, 1.03, 0.11]} />
        <meshStandardMaterial color="#222027" metalness={0.18} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.66, -0.061]}>
        <planeGeometry args={[1.56, 0.86]} />
        <meshStandardMaterial color="#6f3cc3" emissive="#4c218f" emissiveIntensity={1.15} />
      </mesh>
      <mesh castShadow position={[0, 0.08, 0.03]}>
        <boxGeometry args={[0.18, 0.48, 0.14]} />
        <meshStandardMaterial color="#36323b" roughness={0.55} />
      </mesh>
      <mesh castShadow position={[0, -0.17, -0.08]} rotation={[-0.06, 0, 0]}>
        <boxGeometry args={[1.5, 0.07, 0.42]} />
        <meshStandardMaterial color="#302c35" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[1.08, -0.08, -0.05]}>
        <boxGeometry args={[0.27, 0.13, 0.38]} />
        <meshStandardMaterial color="#2c2930" roughness={0.58} />
      </mesh>
      <mesh castShadow position={[1.68, 0.12, 0.03]} rotation={[0.08, -0.16, 0]}>
        <boxGeometry args={[0.3, 0.58, 0.27]} />
        <meshStandardMaterial color="#edeae7" roughness={0.56} />
      </mesh>
      <mesh castShadow position={[1.68, -0.17, 0.04]}>
        <boxGeometry args={[0.46, 0.08, 0.39]} />
        <meshStandardMaterial color="#3d3940" roughness={0.55} />
      </mesh>
    </group>
  );
}

function PatientPlaceholder() {
  return (
    <group position={[0, 0, 2.48]}>
      <mesh castShadow position={[0, 2.03, 0]}>
        <sphereGeometry args={[0.3, 22, 18]} />
        <meshStandardMaterial color="#d7aa8d" roughness={0.72} />
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
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

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
    setTexture(nextTexture);

    return () => nextTexture.dispose();
  }, [background, fontSize, foreground, height, label, width]);

  return texture;
}

export const pharmacyWorldColors = {
  brand: new Color(BRAND),
};
