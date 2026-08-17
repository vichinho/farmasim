"use client";

import type { MutableRefObject } from "react";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";

export type PlayerInputState = {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  interact: boolean;
};

type Props = {
  inputRef: MutableRefObject<PlayerInputState>;
};

const PLAYER_HEIGHT = 1.62;
const MOVE_SPEED = 2.35;
const LOOK_SENSITIVITY = 0.00215;
const MOBILE_LOOK_SENSITIVITY = 0.0032;
const BOUNDS = {
  minX: -5.15,
  maxX: 5.15,
  minZ: -3.12,
  maxZ: 0.82,
};

export function FirstPersonPlayer({ inputRef }: Props) {
  const { camera, gl } = useThree();
  const keyboard = useRef(new Set<string>());
  const yaw = useRef(Math.PI);
  const pitch = useRef(-0.03);
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());
  const movement = useRef(new Vector3());

  useEffect(() => {
    camera.position.set(0, PLAYER_HEIGHT, 0.15);
    camera.rotation.order = "YXZ";
    camera.rotation.set(pitch.current, yaw.current, 0);
  }, [camera]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => keyboard.current.add(event.code);
    const onKeyUp = (event: KeyboardEvent) => keyboard.current.delete(event.code);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    const canPointerLock = () => !window.matchMedia("(pointer: coarse)").matches;

    const requestPointerLock = () => {
      if (!canPointerLock() || document.pointerLockElement === canvas) return;
      void canvas.requestPointerLock?.();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;

      yaw.current -= event.movementX * LOOK_SENSITIVITY;
      pitch.current = MathUtils.clamp(
        pitch.current - event.movementY * LOOK_SENSITIVITY,
        -1.18,
        1.05,
      );
    };

    canvas.addEventListener("click", requestPointerLock);
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      canvas.removeEventListener("click", requestPointerLock);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const input = inputRef.current;

    if (input.lookX !== 0 || input.lookY !== 0) {
      yaw.current -= input.lookX * MOBILE_LOOK_SENSITIVITY;
      pitch.current = MathUtils.clamp(
        pitch.current - input.lookY * MOBILE_LOOK_SENSITIVITY,
        -1.18,
        1.05,
      );
      input.lookX = 0;
      input.lookY = 0;
    }

    camera.rotation.set(pitch.current, yaw.current, 0);

    const keyboardX = Number(keyboard.current.has("KeyD")) - Number(keyboard.current.has("KeyA"));
    const keyboardY = Number(keyboard.current.has("KeyW")) - Number(keyboard.current.has("KeyS"));
    const moveX = MathUtils.clamp(keyboardX + input.moveX, -1, 1);
    const moveY = MathUtils.clamp(keyboardY + input.moveY, -1, 1);

    if (moveX === 0 && moveY === 0) return;

    forward.current.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    right.current.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
    movement.current
      .copy(forward.current)
      .multiplyScalar(moveY)
      .addScaledVector(right.current, moveX);

    if (movement.current.lengthSq() > 1) {
      movement.current.normalize();
    }

    const nextX = camera.position.x + movement.current.x * MOVE_SPEED * delta;
    const nextZ = camera.position.z + movement.current.z * MOVE_SPEED * delta;

    camera.position.x = MathUtils.clamp(nextX, BOUNDS.minX, BOUNDS.maxX);
    camera.position.y = PLAYER_HEIGHT;
    camera.position.z = MathUtils.clamp(nextZ, BOUNDS.minZ, BOUNDS.maxZ);
  });

  return null;
}
