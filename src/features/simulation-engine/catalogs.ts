import type {
  HealthcareFacility,
  MedicationPresentation,
  SyntheticPatient,
} from "@/features/simulation-engine/types";

export type SimulationCatalogs = {
  patients: readonly SyntheticPatient[];
  facilities: readonly HealthcareFacility[];
  presentations: readonly MedicationPresentation[];
};

/**
 * Development-only data used to exercise the generator before the validated
 * 2026 arsenal is connected. Medication presentations mirror the synthetic
 * fixtures already used by the current training prototype; this is not an
 * authoritative pharmacotherapeutic catalog.
 */
export const technicalSimulationCatalogs: SimulationCatalogs = {
  patients: [
    {
      id: "patient-marta-fuentes-soto",
      firstName: "Marta",
      lastName1: "Fuentes",
      lastName2: "Soto",
      syntheticRut: "12.345.678-9",
      age: 58,
    },
    {
      id: "patient-elena-gonzalez-silva",
      firstName: "Elena",
      lastName1: "González",
      lastName2: "Silva",
      syntheticRut: "19.876.543-2",
      age: 61,
    },
    {
      id: "patient-camila-rojas-mella",
      firstName: "Camila",
      lastName1: "Rojas",
      lastName2: "Mella",
      syntheticRut: "17.246.831-4",
      age: 47,
    },
    {
      id: "patient-daniel-munoz-paredes",
      firstName: "Daniel",
      lastName1: "Muñoz",
      lastName2: "Paredes",
      syntheticRut: "15.731.420-8",
      age: 66,
    },
    {
      id: "patient-maria-elena-gonzalez-soto",
      firstName: "María Elena",
      lastName1: "González",
      lastName2: "Soto",
      syntheticRut: "18.402.715-6",
      age: 52,
    },
    {
      id: "patient-maria-elena-gonzalez-silva",
      firstName: "María Elena",
      lastName1: "González",
      lastName2: "Silva",
      syntheticRut: "16.904.328-1",
      age: 54,
    },
  ],
  facilities: [
    { id: "facility-tome", name: "Hospital de Tomé", type: "hospital" },
    { id: "facility-las-higueras", name: "Hospital Las Higueras", type: "hospital" },
    { id: "facility-bellavista", name: "CESFAM Bellavista", type: "cesfam" },
    { id: "facility-alberto-reyes", name: "CESFAM Alberto Reyes", type: "cesfam" },
    { id: "facility-cosam", name: "COSAM", type: "cosam" },
    { id: "facility-san-rafael", name: "San Rafael", type: "other" },
    { id: "facility-penco", name: "Penco", type: "other" },
    { id: "facility-lirquen", name: "Lirquén", type: "other" },
  ],
  presentations: [
    {
      id: "losartan-50",
      medicationId: "losartan",
      genericName: "Losartán",
      strength: "50 mg",
      pharmaceuticalForm: "Comprimido",
      packageQuantity: 30,
    },
    {
      id: "losartan-100",
      medicationId: "losartan",
      genericName: "Losartán",
      strength: "100 mg",
      pharmaceuticalForm: "Comprimido",
      packageQuantity: 30,
    },
    {
      id: "amlodipino-5",
      medicationId: "amlodipino",
      genericName: "Amlodipino",
      strength: "5 mg",
      pharmaceuticalForm: "Comprimido",
      packageQuantity: 30,
    },
    {
      id: "paracetamol-500",
      medicationId: "paracetamol",
      genericName: "Paracetamol",
      strength: "500 mg",
      pharmaceuticalForm: "Comprimido",
      packageQuantity: 20,
    },
  ],
};
