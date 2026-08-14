"use client";

import { useMemo } from "react";

import { PROFESSIONAL_REVIEW_MARKER, type TrainingStage } from "@/types/training-simulation";

import type {
  PatientAnimationState,
  SceneFeedbackTone,
  WorkspaceArea,
} from "./scene-types";

type SceneStateInput = {
  feedbackTone: SceneFeedbackTone;
  isComplete: boolean;
  outcome: { errorReachedPatient: boolean };
  stage: TrainingStage;
};

export type PatientSceneState = {
  activeWorkspace: WorkspaceArea;
  dialogue: string;
  patientState: PatientAnimationState;
  status: string;
};

export function usePatientSceneState({
  feedbackTone,
  isComplete,
  outcome,
  stage,
}: SceneStateInput): PatientSceneState {
  return useMemo(() => {
    if (isComplete) {
      return sceneState("leaving", "service", "La atención simulada ha finalizado.", "Turno cerrado");
    }

    if (feedbackTone === "positive") {
      return sceneState(
        "positive-reaction",
        areaForStage(stage),
        "Gracias. Continuemos con la atención.",
        "Respuesta registrada",
      );
    }

    if (feedbackTone === "concerned") {
      return sceneState(
        "concerned-reaction",
        areaForStage(stage),
        "Espero mientras vuelves a comprobar la información.",
        "Revisión necesaria",
      );
    }

    if (stage.type === "context") {
      return sceneState("hidden", "service", "Esperando el llamado del turno.", "Preparando A-01");
    }

    if (stage.type === "patient-dialogue") {
      return sceneState("entering", "service", cleanContent(stage.content), "Paciente ingresando");
    }

    if (stage.type === "identification") {
      return sceneState(
        "handing-document",
        "service",
        "Aquí está mi solicitud ficticia para la actividad.",
        "Documento recibido",
      );
    }

    if (stage.type === "clinical-system" || stage.type === "prescription") {
      return sceneState(
        "waiting",
        "system",
        "Quedo atento mientras revisas el sistema.",
        "Revisión en sistema",
      );
    }

    if (stage.type === "storage-selection" || stage.area === "storage") {
      return sceneState(
        "waiting",
        "storage",
        "Espero mientras realizas la selección ficticia.",
        "Selección en gavetas",
      );
    }

    if (stage.type === "preparation" || stage.area === "preparation-counter") {
      return sceneState(
        "waiting",
        "preparation",
        "Permanezco en la ventanilla durante la preparación.",
        "Preparación en curso",
      );
    }

    if (stage.type === "safety-barrier" || stage.type === "final-verification") {
      return sceneState(
        outcome.errorReachedPatient ? "concerned-reaction" : "idle",
        "verification",
        "Espero mientras completas la verificación final.",
        "Verificación activa",
      );
    }

    if (stage.type === "dispatch") {
      return sceneState(
        outcome.errorReachedPatient ? "concerned-reaction" : "positive-reaction",
        "verification",
        outcome.errorReachedPatient
          ? "Hay una discrepancia ficticia pendiente de revisión."
          : "Gracias por completar las verificaciones.",
        "Cierre de atención",
      );
    }

    if (stage.type === "result") {
      return sceneState(
        outcome.errorReachedPatient ? "concerned-reaction" : "positive-reaction",
        "service",
        outcome.errorReachedPatient
          ? "La actividad registró una discrepancia pendiente."
          : "La atención simulada se completó correctamente.",
        "Resultado disponible",
      );
    }

    return sceneState("idle", areaForStage(stage), "Continuemos con la atención.", "Atención en curso");
  }, [feedbackTone, isComplete, outcome.errorReachedPatient, stage]);
}

function areaForStage(stage: TrainingStage): WorkspaceArea {
  if (stage.area === "clinical-terminal") return "system";
  if (stage.area === "storage") return "storage";
  if (stage.area === "preparation-counter") return "preparation";
  if (stage.area === "dispatch-counter") return "verification";
  return "service";
}

function sceneState(
  patientState: PatientAnimationState,
  activeWorkspace: WorkspaceArea,
  dialogue: string,
  status: string,
): PatientSceneState {
  return { activeWorkspace, dialogue, patientState, status };
}

function cleanContent(content: string) {
  return content.replace(PROFESSIONAL_REVIEW_MARKER, "").trim();
}
