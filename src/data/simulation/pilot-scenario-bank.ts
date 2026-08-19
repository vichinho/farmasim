import {
  generateScenarioDefinition,
  reinforcementVariantForSeed,
  type PlayerRole,
  type ReinforcementCompetency,
  type ScenarioDefinition,
  type SimulationMode,
} from "@/features/simulation-engine";

export type ScenarioDifficulty = "foundational" | "standard" | "advanced";

export type PilotScenarioSpec = {
  id: string;
  title: string;
  competency: ReinforcementCompetency;
  playerRole: PlayerRole;
  mode: SimulationMode;
  difficulty: ScenarioDifficulty;
  challengeKey: string;
  seed: number;
  learningFocus: string;
};

/**
 * Controlled pilot used to validate the scenario-bank design before scaling to
 * 40+ cases. Seeds are intentional: the first eight entries rotate through the
 * eight synthetic patients and eight establishments while covering the main
 * competencies and both participant roles.
 */
export const pilotScenarioMatrix: PilotScenarioSpec[] = [
  {
    id: "pilot-01-previous-patient",
    title: "Piloto 01 · Ficha anterior abierta",
    competency: "patient-identification",
    playerRole: "tens-1",
    mode: "guided",
    difficulty: "foundational",
    challengeKey: "patient-previous-record",
    seed: 2,
    learningFocus: "Buscar y confirmar al paciente correcto aunque el sistema conserve una ficha previa.",
  },
  {
    id: "pilot-02-similar-identity",
    title: "Piloto 02 · Identidad similar",
    competency: "patient-identification",
    playerRole: "tens-1",
    mode: "practice",
    difficulty: "standard",
    challengeKey: "patient-similar-identity",
    seed: 1,
    learningFocus: "Distinguir al paciente correcto frente a una identidad visualmente similar.",
  },
  {
    id: "pilot-03-pending-prescription",
    title: "Piloto 03 · Prescripción pendiente",
    competency: "prescription-review",
    playerRole: "tens-1",
    mode: "assessment",
    difficulty: "advanced",
    challengeKey: "prescription-pending-status",
    seed: 12,
    learningFocus: "Tomar una decisión operativa sobre el estado de la prescripción y detener cuando corresponda.",
  },
  {
    id: "pilot-04-historical-lookalike",
    title: "Piloto 04 · Histórico parecido",
    competency: "prescription-review",
    playerRole: "tens-1",
    mode: "practice",
    difficulty: "standard",
    challengeKey: "prescription-historical-lookalike",
    seed: 6,
    learningFocus: "Separar prescripciones disponibles del registro histórico parecido.",
  },
  {
    id: "pilot-05-wrong-strength",
    title: "Piloto 05 · Concentración incorrecta",
    competency: "preparation-comparison",
    playerRole: "tens-2",
    mode: "guided",
    difficulty: "foundational",
    challengeKey: "preparation-wrong-strength",
    seed: 28,
    learningFocus: "Detectar dos concentraciones reales del mismo medicamento y elegir la presentación prescrita.",
  },
  {
    id: "pilot-06-wrong-product",
    title: "Piloto 06 · Producto incorrecto",
    competency: "preparation-comparison",
    playerRole: "tens-2",
    mode: "practice",
    difficulty: "standard",
    challengeKey: "preparation-wrong-product",
    seed: 8,
    learningFocus: "Reconocer una mezcla de productos en almacenamiento y preparar manualmente la bandeja correcta.",
  },
  {
    id: "pilot-07-wrong-quantity",
    title: "Piloto 07 · Cantidad sugerida incorrecta",
    competency: "preparation-comparison",
    playerRole: "tens-2",
    mode: "assessment",
    difficulty: "advanced",
    challengeKey: "preparation-wrong-quantity",
    seed: 7,
    learningFocus: "Corregir una cantidad sugerida incorrecta antes de agregar el producto a la bandeja.",
  },
  {
    id: "pilot-08-final-similar-identity",
    title: "Piloto 08 · Reidentificación con distractor",
    competency: "final-identification",
    playerRole: "tens-1",
    mode: "practice",
    difficulty: "standard",
    challengeKey: "final-similar-identity",
    seed: 30,
    learningFocus: "Reidentificar al paciente correcto antes del handoff pese a una identidad similar.",
  },
  {
    id: "pilot-09-final-previous-record",
    title: "Piloto 09 · Reidentificación tras ficha previa",
    competency: "final-identification",
    playerRole: "tens-1",
    mode: "assessment",
    difficulty: "advanced",
    challengeKey: "final-previous-record",
    seed: 1,
    learningFocus: "Evitar que el contexto de una ficha previa contamine la reidentificación final.",
  },
  {
    id: "pilot-10-qf-escalation-instructions",
    title: "Piloto 10 · Cuándo escalar al QF",
    competency: "instructions",
    playerRole: "tens-1",
    mode: "guided",
    difficulty: "foundational",
    challengeKey: "instructions-qf-escalation",
    seed: 2,
    learningFocus: "Registrar explícitamente la sección de indicaciones sobre cuándo consultar al QF.",
  },
];

export function getPilotScenarioSpec(id: string) {
  return pilotScenarioMatrix.find((scenario) => scenario.id === id);
}

export function buildPilotScenario(spec: PilotScenarioSpec): ScenarioDefinition {
  const variant = reinforcementVariantForSeed(spec.seed, spec.competency);
  if (variant.challengeKey !== spec.challengeKey) {
    throw new Error(
      `Pilot ${spec.id} expected ${spec.challengeKey} but seed ${spec.seed} generated ${variant.challengeKey}`,
    );
  }

  const scenario = generateScenarioDefinition({
    id: spec.id,
    mode: spec.mode,
    seed: spec.seed,
    reinforcementCompetency: spec.competency,
  });

  if (scenario.requiredPlayerRole !== spec.playerRole) {
    throw new Error(
      `Pilot ${spec.id} expected role ${spec.playerRole} but generated ${scenario.requiredPlayerRole ?? "none"}`,
    );
  }

  return scenario;
}

export function buildPilotScenarioBank() {
  return pilotScenarioMatrix.map((spec) => ({ spec, scenario: buildPilotScenario(spec) }));
}
