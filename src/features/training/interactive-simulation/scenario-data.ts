import type { SimulationScenario } from "./types";

export const ambulatoryDispensingScenario: SimulationScenario = {
  id: "case-001-operational-dispensing",
  title: "Dispensación ambulatoria · Caso 001",
  patient: { fullName: "Luis Herrera Soto", rut: "12.345.678-9" },
  prescriptions: [
    { id: "rx-01", issuedAt: "14 ago. 2026", valid: true, medication: { id: "losartan-50", name: "Losartán", concentration: "50 mg", form: "Comprimidos", quantity: 30, directions: "1 comprimido cada 12 horas" } },
    { id: "rx-02", issuedAt: "14 ago. 2026", valid: true, medication: { id: "metformin-850", name: "Metformina", concentration: "850 mg", form: "Comprimidos", quantity: 60, directions: "1 comprimido cada 12 horas con alimentos" } },
    { id: "rx-03", issuedAt: "14 ago. 2026", valid: true, medication: { id: "atorvastatin-20", name: "Atorvastatina", concentration: "20 mg", form: "Comprimidos", quantity: 30, directions: "1 comprimido por la noche" } },
  ],
  preparedMedications: [
    { id: "prepared-losartan", prescriptionId: "rx-01", name: "Losartán", concentration: "100 mg", form: "Comprimidos", quantity: 30, directions: "1 comprimido cada 12 horas" },
    { id: "prepared-metformin", prescriptionId: "rx-02", name: "Metformina", concentration: "850 mg", form: "Comprimidos", quantity: 60, directions: "1 comprimido cada 12 horas con alimentos" },
    { id: "prepared-atorvastatin", prescriptionId: "rx-03", name: "Atorvastatina", concentration: "20 mg", form: "Comprimidos", quantity: 30, directions: "1 comprimido por la noche" },
  ],
  hiddenErrors: [{ type: "wrong_concentration", prescriptionId: "rx-01", expectedValue: "50 mg", actualValue: "100 mg" }],
};
