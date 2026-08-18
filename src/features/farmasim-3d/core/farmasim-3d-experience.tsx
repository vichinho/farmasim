"use client";

import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import { SimulationHud } from "@/features/farmasim-3d/hud/simulation-hud";
import {
  InteractionSystem,
  type FocusedWorldInteraction,
} from "@/features/farmasim-3d/interaction/interaction-system";
import {
  CASE001_3D_CATALOGS,
  CASE001_3D_DEFINITION,
  CASE001_3D_GENERATION,
  CASE001_3D_INTEGRATION_SEED,
} from "@/features/farmasim-3d/integration/case001-config";
import {
  FirstPersonPlayer,
  type PlayerInputState,
} from "@/features/farmasim-3d/player/first-person-player";
import { MobileControls } from "@/features/farmasim-3d/responsive/mobile-controls";
import { OrientationGuard } from "@/features/farmasim-3d/responsive/orientation-guard";
import { PharmacyWorld } from "@/features/farmasim-3d/world/pharmacy-world";
import { useSimulationExperience } from "@/features/simulation-engine/presentation";

export function FarmaSim3DExperience() {
  const inputRef = useRef<PlayerInputState>({
    moveX: 0,
    moveY: 0,
    lookX: 0,
    lookY: 0,
    interact: false,
  });
  const [focusedInteraction, setFocusedInteraction] =
    useState<FocusedWorldInteraction | null>(null);
  const [interactionMessage, setInteractionMessage] = useState<string | null>(null);

  const experience = useSimulationExperience({
    definition: CASE001_3D_DEFINITION,
    seed: CASE001_3D_INTEGRATION_SEED,
    catalogs: CASE001_3D_CATALOGS,
    generation: CASE001_3D_GENERATION,
    scenarioSlug: "case-001-ambulatory-dispensing",
    levelNumber: 1,
  });

  const snapshot = experience.state?.snapshot ?? null;
  const patient = snapshot?.patients.find(
    (candidate) => candidate.id === snapshot.session.patientId,
  );

  const handleInteract = useCallback(
    (interaction: FocusedWorldInteraction) => {
      const current = experience.state?.snapshot;
      if (!current) return;

      if (interaction.kind === "patient") {
        const receipt = experience.dispatch({
          type: "document.requested",
          targetType: "document",
          targetId: `${current.session.patientId}-document`,
        });

        if (receipt) {
          setInteractionMessage("Documento solicitado al paciente · evento registrado");
        }
        return;
      }

      if (interaction.kind === "computer") {
        if (!current.capabilities.canUseClinicalSystem) {
          setInteractionMessage("El sistema clínico no está disponible para este rol");
          return;
        }

        const receipt = experience.dispatch({
          type: "computer.focused",
          targetType: "computer",
          targetId: interaction.id,
        });

        if (receipt) {
          setInteractionMessage("Computador enfocado · evento registrado");
        }
      }
    },
    [experience],
  );

  return (
    <OrientationGuard>
      <main
        className="relative h-dvh w-screen overflow-hidden bg-[#17131f]"
        style={{ touchAction: "none" }}
      >
        {snapshot ? (
          <>
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
              <InteractionSystem
                inputRef={inputRef}
                onFocusChange={setFocusedInteraction}
                onInteract={handleInteract}
              />
            </Canvas>

            <SimulationHud
              dirty={experience.state?.dirty ?? false}
              focusedInteraction={focusedInteraction}
              interactionMessage={interactionMessage}
              patientName={patient?.displayName ?? "Paciente asignado"}
              snapshot={snapshot}
              source={experience.state?.source ?? "generated"}
            />
            <MobileControls inputRef={inputRef} />
          </>
        ) : (
          <div className="grid h-full w-full place-items-center px-6 text-white">
            <div className="max-w-lg rounded-3xl border border-white/10 bg-[#20172c]/90 p-7 text-center shadow-2xl backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">
                FarmaSim · Engine integration
              </p>
              <h1 className="mt-3 text-2xl font-black">
                {experience.phase === "error" ? "No pudimos abrir la sesión" : "Abriendo simulación"}
              </h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
                {experience.error ?? "Generando o reanudando una sesión desde el motor dinámico..."}
              </p>
            </div>
          </div>
        )}
      </main>
    </OrientationGuard>
  );
}
