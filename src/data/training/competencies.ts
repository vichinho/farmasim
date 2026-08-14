import type { TrainingCompetency } from "@/types/training-simulation";

export const trainingCompetencies = [
  {
    id: "patient-identification",
    name: "Identificación",
    description: "Confirma los datos ficticios requeridos por la actividad demostrativa.",
  },
  {
    id: "request-review",
    name: "Revisión de la solicitud",
    description: "Revisa toda la información demostrativa disponible antes de continuar.",
  },
  {
    id: "product-selection",
    name: "Selección del producto",
    description: "Relaciona la solicitud ficticia con el elemento correcto de la simulación.",
  },
  {
    id: "concentration-verification",
    name: "Verificación de concentración",
    description: "Distingue presentaciones visualmente similares dentro del ejercicio ficticio.",
  },
  {
    id: "final-verification",
    name: "Verificación final",
    description: "Comprueba la preparación antes de cerrar el caso demostrativo.",
  },
  {
    id: "storage-domain-separation",
    name: "Separación de dominios",
    description: "Distingue, dentro del ejercicio ficticio, los registros de medicamentos de los registros de insumos médicos.",
  },
  {
    id: "storage-record-review",
    name: "Revisión de almacenamiento",
    description: "Completa una revisión ficticia de código, nombre, estado y observación antes de cerrar el registro.",
  },
] satisfies TrainingCompetency[];
