import { createReinforcementCase } from "@/data/training/cases/create-reinforcement-case";

export const case002ConcentrationReinforcement = createReinforcementCase({
  id: "case-002-concentration-reinforcement",
  title: "Caso 002 - Refuerzo de concentración",
  description: "Nuevo contexto ficticio para reforzar la comparación de concentraciones.",
  timeLabel: "10:12 h",
  location: "Farmacia comunitaria ficticia",
  patientDescription: "Paciente virtual adulta, sin información personal real.",
  patientDialogue: "Hola, vengo a retirar una solicitud que aparece en el sistema.",
  productName: "Metformina",
  requestedStrength: "500 mg",
  distractorStrength: "850 mg",
  distractorFirst: true,
  reinforcementCaseSlug: "case-003-concentration-reinforcement",
});

export const case003ConcentrationReinforcement = createReinforcementCase({
  id: "case-003-concentration-reinforcement",
  title: "Caso 003 - Cambio de disposición",
  description: "Practica la misma competencia con otra persona, producto y ubicación visual.",
  timeLabel: "12:46 h",
  location: "Módulo de atención ficticio B",
  patientDescription: "Paciente virtual joven, sin información personal real.",
  patientDialogue: "Buenas tardes, me indicaron que mi solicitud ficticia ya está disponible.",
  productName: "Amlodipino",
  requestedStrength: "5 mg",
  distractorStrength: "10 mg",
  reinforcementCaseSlug: "case-004-concentration-reinforcement",
});

export const case004ConcentrationReinforcement = createReinforcementCase({
  id: "case-004-concentration-reinforcement",
  title: "Caso 004 - Consolidación",
  description: "Último escenario demostrativo para consolidar la verificación de concentración.",
  timeLabel: "16:05 h",
  location: "Área ambulatoria ficticia C",
  patientDescription: "Paciente virtual de mediana edad, sin información personal real.",
  patientDialogue: "Hola, necesito revisar una solicitud ficticia pendiente.",
  productName: "Omeprazol",
  requestedStrength: "20 mg",
  distractorStrength: "40 mg",
  distractorFirst: true,
});
