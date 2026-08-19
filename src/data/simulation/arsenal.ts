import type { MedicationPresentation } from "@/features/simulation-engine/types";

/**
 * Temporary subset kept only so the current 2D flow remains runnable.
 * It is NOT the authoritative Atención Abierta arsenal and must not be used
 * to fabricate alternative strengths/forms for discrepancy scenarios.
 * Replace this module with the institutional source before enabling the
 * concentration/form scenario bank.
 */
export const ambulatoryArsenal: MedicationPresentation[] = [
  {
    id: "losartan-50-tablet-30",
    medicationId: "losartan",
    medicationName: "Losartán",
    strength: "50 mg",
    pharmaceuticalForm: "Comprimido",
    packageQuantity: 30,
    education: {
      purpose: "Información educativa definida por el escenario y pendiente de validación institucional.",
      relevantSchedule: "Seguir la indicación registrada en la prescripción.",
      administerWith: "Agua, salvo indicación profesional diferente.",
      avoid: ["Cambiar la dosis sin consultar"],
      practicalRecommendation: "Mantener el medicamento en su envase identificado.",
      consultQfWhen: ["Existan dudas sobre la forma de administración", "La receta y el producto no coincidan"],
    },
  },
  {
    id: "amlodipine-5-tablet-30",
    medicationId: "amlodipine",
    medicationName: "Amlodipino",
    strength: "5 mg",
    pharmaceuticalForm: "Comprimido",
    packageQuantity: 30,
  },
  {
    id: "paracetamol-500-tablet-20",
    medicationId: "paracetamol",
    medicationName: "Paracetamol",
    strength: "500 mg",
    pharmaceuticalForm: "Comprimido",
    packageQuantity: 20,
  },
];
