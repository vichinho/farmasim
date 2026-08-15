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

export type WorkspaceArea =
  | "service"
  | "system"
  | "storage"
  | "preparation"
  | "verification";

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
    accent: "#256a68",
    coat: "#3b6670",
    hair: "#2d2524",
    id: "patient-a01",
    imageHeight: 1326,
    imageSrc: "",
    imageWidth: 1186,
    name: "Paciente virtual A-01",
    shirt: "#d2e7ea",
    skin: "#bc795b",
    turn: "A-01",
  },
  "case-002-concentration-reinforcement": {
    accent: "#66518a",
    coat: "#6c597c",
    hair: "#45362f",
    id: "patient-a02",
    imageHeight: 1326,
    imageSrc: "",
    imageWidth: 1186,
    name: "Paciente virtual A-02",
    shirt: "#e7d9e7",
    skin: "#9c6048",
    turn: "A-02",
  },
  "case-003-concentration-reinforcement": {
    accent: "#2b6685",
    coat: "#3f7996",
    hair: "#252c31",
    id: "patient-a03",
    imageHeight: 1325,
    imageSrc: "",
    imageWidth: 1187,
    name: "Paciente virtual A-03",
    shirt: "#d4e8ef",
    skin: "#cc8f69",
    turn: "A-03",
  },
  "case-004-concentration-reinforcement": {
    accent: "#80633c",
    coat: "#9a7652",
    hair: "#6d5040",
    id: "patient-a04",
    imageHeight: 1326,
    imageSrc: "",
    imageWidth: 1186,
    name: "Paciente virtual A-04",
    shirt: "#e5e5ca",
    skin: "#ad6c50",
    turn: "A-04",
  },
};

export function getPatientProfile(caseId: string): PatientProfile {
  return profiles[caseId] ?? profiles["case-001-ambulatory-dispensing"];
}