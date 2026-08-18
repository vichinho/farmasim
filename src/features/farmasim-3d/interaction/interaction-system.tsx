"use client";

import type { MutableRefObject } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Object3D, Raycaster, Vector2 } from "three";

import type { PlayerInputState } from "@/features/farmasim-3d/player/first-person-player";

export type WorldInteractionKind = "patient" | "computer" | "drawer" | "medication";

export type WorldInteractableDefinition = {
  id: string;
  kind: WorldInteractionKind;
  label: string;
  maxDistance?: number;
};

export type FocusedWorldInteraction = WorldInteractableDefinition & {
  distance: number;
};

type Props = {
  inputRef: MutableRefObject<PlayerInputState>;
  onFocusChange: (interaction: FocusedWorldInteraction | null) => void;
  onInteract: (interaction: FocusedWorldInteraction) => void;
  defaultMaxDistance?: number;
};

const CENTER = new Vector2(0, 0);
const USER_DATA_KEY = "farmasimInteractable";

export function interactableUserData(definition: WorldInteractableDefinition) {
  return { [USER_DATA_KEY]: definition };
}

function resolveInteractable(object: Object3D): WorldInteractableDefinition | null {
  let current: Object3D | null = object;

  while (current) {
    const definition = current.userData?.[USER_DATA_KEY] as
      | WorldInteractableDefinition
      | undefined;
    if (definition) return definition;
    current = current.parent;
  }

  return null;
}

export function InteractionSystem({
  inputRef,
  onFocusChange,
  onInteract,
  defaultMaxDistance = 2.6,
}: Props) {
  const { camera, scene } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);
  const focusedKey = useRef<string | null>(null);
  const focusedInteraction = useRef<FocusedWorldInteraction | null>(null);
  const keyboardInteractRequested = useRef(false);
  const previousMobileInteract = useRef(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "KeyE" || event.repeat) return;
      keyboardInteractRequested.current = true;
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useFrame(() => {
    raycaster.setFromCamera(CENTER, camera);
    const intersections = raycaster.intersectObjects(scene.children, true);

    let next: FocusedWorldInteraction | null = null;

    for (const intersection of intersections) {
      const definition = resolveInteractable(intersection.object);
      if (!definition) continue;

      const maxDistance = definition.maxDistance ?? defaultMaxDistance;
      if (intersection.distance > maxDistance) continue;

      next = {
        ...definition,
        distance: intersection.distance,
      };
      break;
    }

    const nextKey = next ? `${next.kind}:${next.id}` : null;
    if (focusedKey.current !== nextKey) {
      focusedKey.current = nextKey;
      focusedInteraction.current = next;
      onFocusChange(next);
    } else {
      focusedInteraction.current = next;
    }

    const mobilePressed = inputRef.current.interact;
    const mobileInteractionRequested = mobilePressed && !previousMobileInteract.current;
    previousMobileInteract.current = mobilePressed;

    const shouldInteract =
      keyboardInteractRequested.current || mobileInteractionRequested;
    keyboardInteractRequested.current = false;

    if (shouldInteract && focusedInteraction.current) {
      onInteract(focusedInteraction.current);
    }
  });

  return null;
}
