export type PatientAnimationState =
  | "hidden"
  | "entering"
  | "approaching"
  | "idle"
  | "speaking"
  | "handing-document"
  | "waiting"
  | "positive-reaction"
  | "concerned-reaction"
  | "leaving";

export type SceneFeedbackTone = "positive" | "concerned" | null;

export type WorkspaceArea = "service" | "system" | "storage" | "preparation" | "verification";

export type PatientProfile = {
  accent: string;
  coat: string;
  hair: string;
  id: string;
  imageHeight: number;
  imageSrc: string;
  imageWidth: number;
  name: string;
  shirt: string;
  skin: string;
  turn: string;
};

const profiles: Record<string, PatientProfile> = {
  "case-001-ambulatory-dispensing": {
    accent: "#335f51",
    coat: "#9a6a43",
    hair: "#d7d2c8",
    id: "patient-a01",
    imageHeight: 1326,
    imageSrc: "/scenes/patient-jorge-v2.png",
    imageWidth: 1186,
    name: "Paciente virtual A-01",
    shirt: "#7894aa",
    skin: "#c9875f",
    turn: "A-01",
  },
  "case-002-concentration-reinforcement": {
    accent: "#6b4f75",
    coat: "#74617e",
    hair: "#3f302c",
    id: "patient-a02",
    imageHeight: 1326,
    imageSrc: "/scenes/patient-a02-v2.png",
    imageWidth: 1186,
    name: "Paciente virtual A-02",
    shirt: "#d5b6a4",
    skin: "#a96848",
    turn: "A-02",
  },
  "case-003-concentration-reinforcement": {
    accent: "#315b77",
    coat: "#436c83",
    hair: "#292a2d",
    id: "patient-a03",
    imageHeight: 1325,
    imageSrc: "/scenes/patient-a03-v2.png",
    imageWidth: 1187,
    name: "Paciente virtual A-03",
    shirt: "#c7d6de",
    skin: "#d39a73",
    turn: "A-03",
  },
  "case-004-concentration-reinforcement": {
    accent: "#6b5437",
    coat: "#a47c55",
    hair: "#6b5140",
    id: "patient-a04",
    imageHeight: 1326,
    imageSrc: "/scenes/patient-a04-v2.png",
    imageWidth: 1186,
    name: "Paciente virtual A-04",
    shirt: "#dae1c0",
    skin: "#b87553",
    turn: "A-04",
  },
};

export function getPatientProfile(caseId: string): PatientProfile {
  return profiles[caseId] ?? profiles["case-001-ambulatory-dispensing"];
}
