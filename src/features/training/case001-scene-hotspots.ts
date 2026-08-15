export type SceneHotspotId =
  | "patient"
  | "reception"
  | "computer"
  | "storage"
  | "preparation"
  | "tray";

export interface SceneHotspot {
  id: SceneHotspotId;
  label: string;
  x: string;
  y: string;
}

export const sceneHotspots: SceneHotspot[] = [
  { id: "patient", label: "Paciente", x: "7.5%", y: "61%" },
  { id: "reception", label: "TENS 1 · Recepción", x: "46%", y: "23%" },
  { id: "computer", label: "Computador", x: "39%", y: "64%" },
  { id: "storage", label: "Gavetas / almacenamiento", x: "73%", y: "12.5%" },
  { id: "preparation", label: "TENS 2 · Preparación", x: "79%", y: "39%" },
  { id: "tray", label: "Bandeja", x: "75%", y: "66%" },
];
