import type { HealthcareFacility, SyntheticPatient } from "@/features/simulation-engine/types";

const SYNTHETIC_PATIENT_NAMES = [
  ["Camila", "Rojas", "Mella"],
  ["Camila", "Rojas", "Melo"],
  ["María Elena", "González", "Soto"],
  ["María Elena", "González", "Silva"],
  ["Daniel", "Muñoz", "Paredes"],
  ["Daniela", "Muñoz", "Paredes"],
  ["Sofía", "Contreras", "Mardones"],
  ["Sofía", "Contreras", "Martínez"],
  ["Javier", "Sepúlveda", "Reyes"],
  ["Javiera", "Sepúlveda", "Reyes"],
  ["Ignacio", "Carrasco", "Vera"],
  ["Isidora", "Carrasco", "Vega"],
  ["Valentina", "Navarrete", "Salazar"],
  ["Valentín", "Navarrete", "Salinas"],
  ["Matías", "Henríquez", "Cáceres"],
  ["Martina", "Henríquez", "Cáceres"],
  ["Francisca", "Aravena", "Leiva"],
  ["Francisco", "Aravena", "Leiva"],
  ["Constanza", "Bustamante", "Riquelme"],
  ["Cristóbal", "Bustamante", "Riquelme"],
  ["Antonia", "Saavedra", "Urrutia"],
  ["Antonio", "Saavedra", "Urrutia"],
  ["Catalina", "Figueroa", "Jara"],
  ["Benjamín", "Figueroa", "Jara"],
  ["Fernanda", "Valdés", "Escobar"],
  ["Felipe", "Valdés", "Escobar"],
  ["Paula", "Cisternas", "Acuña"],
  ["Pablo", "Cisternas", "Acuña"],
  ["Carolina", "Mendoza", "Lagos"],
  ["Carlos", "Mendoza", "Lagos"],
  ["Andrea", "Sandoval", "Pino"],
  ["Andrés", "Sandoval", "Pino"],
  ["Natalia", "Espinoza", "Quezada"],
  ["Nicolás", "Espinoza", "Quezada"],
  ["Macarena", "Orellana", "Tapia"],
  ["Marcelo", "Orellana", "Tapia"],
  ["Josefa", "Alarcón", "Sepúlveda"],
  ["José", "Alarcón", "Sepúlveda"],
  ["Trinidad", "Mora", "Delgado"],
  ["Tomás", "Mora", "Delgado"],
] as const;

function chileRutVerifier(number: number): string {
  let multiplier = 2;
  let sum = 0;
  let remaining = number;

  while (remaining > 0) {
    sum += (remaining % 10) * multiplier;
    remaining = Math.floor(remaining / 10);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const result = 11 - (sum % 11);
  if (result === 11) return "0";
  if (result === 10) return "K";
  return String(result);
}

function deliberatelyInvalidVerifier(valid: string): string {
  const candidates = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "K"];
  return candidates.find((candidate) => candidate !== valid) ?? "0";
}

function formatRut(number: number, verifier: string): string {
  const digits = String(number).padStart(8, "0");
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}-${verifier}`;
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const syntheticPatientCatalog: readonly SyntheticPatient[] = SYNTHETIC_PATIENT_NAMES.map(
  ([firstName, lastName1, lastName2], index) => {
    const rutNumber = 70_000_001 + index;
    const invalidVerifier = deliberatelyInvalidVerifier(chileRutVerifier(rutNumber));

    return {
      id: `synthetic-patient-${index + 1}-${slug(`${firstName}-${lastName1}-${lastName2}`)}`,
      firstName,
      lastName1,
      lastName2,
      syntheticRut: formatRut(rutNumber, invalidVerifier),
      age: 24 + ((index * 7) % 61),
    };
  },
);

export const healthcareFacilityCatalog: readonly HealthcareFacility[] = [
  { id: "facility-hospital-tome", name: "Hospital de Tomé", type: "hospital" },
  { id: "facility-hospital-las-higueras", name: "Hospital Las Higueras", type: "hospital" },
  { id: "facility-cesfam-bellavista", name: "CESFAM Bellavista", type: "cesfam" },
  { id: "facility-cesfam-alberto-reyes", name: "CESFAM Alberto Reyes", type: "cesfam" },
  { id: "facility-cosam", name: "COSAM", type: "cosam" },
  { id: "facility-san-rafael", name: "San Rafael", type: "other" },
  { id: "facility-penco", name: "Penco", type: "other" },
  { id: "facility-lirquen", name: "Lirquén", type: "other" },
];
