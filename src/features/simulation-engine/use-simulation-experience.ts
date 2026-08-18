"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cloudSimulationExperiencePersistence } from "@/features/simulation-engine/experience-cloud-persistence";
import {
  SimulationExperienceController,
  type FinalizeSimulationExperienceResult,
  type OpenSimulationExperienceInput,
  type SimulationExperiencePersistence,
  type SimulationExperienceState,
} from "@/features/simulation-engine/experience-controller";
import type {
  SimulationIntegrationDispatchReceipt,
  SimulationPlayerActionInput,
} from "@/features/simulation-engine/integration-contract";

export type SimulationExperiencePhase =
  | "opening"
  | "ready"
  | "saving"
  | "finalizing"
  | "discarding"
  | "discarded"
  | "error";

export type UseSimulationExperienceInput = Omit<OpenSimulationExperienceInput, "persistence"> & {
  scenarioSlug: string;
  levelNumber: number;
  persistence?: SimulationExperiencePersistence;
};

export type UseSimulationExperienceResult = {
  phase: SimulationExperiencePhase;
  state: SimulationExperienceState | null;
  error: string | null;
  dispatch: (action: SimulationPlayerActionInput) => SimulationIntegrationDispatchReceipt | null;
  save: () => Promise<SimulationExperienceState | null>;
  finalize: () => Promise<FinalizeSimulationExperienceResult | null>;
  discard: () => Promise<boolean>;
  clearError: () => void;
};

/**
 * React-facing adapter for playable simulation presentations.
 *
 * A visual layer only needs this hook plus the public integration snapshot and
 * player action types. Runtime, bootstrap, serializers, SafetyEngine and
 * Supabase Server Actions remain behind this boundary.
 */
export function useSimulationExperience(
  input: UseSimulationExperienceInput,
): UseSimulationExperienceResult {
  const controllerRef = useRef<SimulationExperienceController | null>(null);
  const persistence = input.persistence ?? cloudSimulationExperiencePersistence;
  const [phase, setPhase] = useState<SimulationExperiencePhase>("opening");
  const [state, setState] = useState<SimulationExperienceState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function open() {
      try {
        const controller = await SimulationExperienceController.open({
          definition: input.definition,
          seed: input.seed,
          catalogs: input.catalogs,
          generation: input.generation,
          persistence,
        });

        if (cancelled) return;
        controllerRef.current = controller;
        setState(controller.state());
        setError(null);
        setPhase("ready");
      } catch (openError) {
        if (cancelled) return;
        controllerRef.current = null;
        setState(null);
        setError(openError instanceof Error ? openError.message : "No pudimos abrir la simulación.");
        setPhase("error");
      }
    }

    void open();

    return () => {
      cancelled = true;
      controllerRef.current = null;
    };
  }, [input.catalogs, input.definition, input.generation, input.seed, persistence]);

  const clearError = useCallback(() => setError(null), []);

  const dispatch = useCallback((action: SimulationPlayerActionInput) => {
    const controller = controllerRef.current;
    if (!controller) return null;

    try {
      const receipt = controller.dispatch(action);
      setState(controller.state());
      setError(null);
      return receipt;
    } catch (dispatchError) {
      setError(
        dispatchError instanceof Error
          ? dispatchError.message
          : "La acción no pudo ejecutarse.",
      );
      return null;
    }
  }, []);

  const save = useCallback(async () => {
    const controller = controllerRef.current;
    if (!controller) return null;

    setPhase("saving");
    try {
      const next = await controller.save();
      setState(next);
      setError(null);
      setPhase("ready");
      return next;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar la simulación.");
      setPhase("ready");
      return null;
    }
  }, []);

  const finalize = useCallback(async () => {
    const controller = controllerRef.current;
    if (!controller) return null;

    setPhase("finalizing");
    try {
      const result = await controller.finalize({
        scenarioSlug: input.scenarioSlug,
        levelNumber: input.levelNumber,
      });
      setState(controller.state());
      setError(result.status === "error" ? result.message : null);
      setPhase("ready");
      return result;
    } catch (finalizeError) {
      setError(
        finalizeError instanceof Error
          ? finalizeError.message
          : "No pudimos finalizar la simulación.",
      );
      setPhase("ready");
      return null;
    }
  }, [input.levelNumber, input.scenarioSlug]);

  const discard = useCallback(async () => {
    const controller = controllerRef.current;
    if (!controller) return false;

    setPhase("discarding");
    try {
      await controller.discard();
      setState(controller.state());
      setError(null);
      setPhase("discarded");
      return true;
    } catch (discardError) {
      setError(
        discardError instanceof Error
          ? discardError.message
          : "No pudimos descartar la sesión guardada.",
      );
      setPhase("ready");
      return false;
    }
  }, []);

  return {
    phase,
    state,
    error,
    dispatch,
    save,
    finalize,
    discard,
    clearError,
  };
}
