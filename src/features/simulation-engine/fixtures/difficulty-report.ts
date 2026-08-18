import { arsenal2026SimulationCatalogs } from "@/features/simulation-engine/catalogs";
import { getDifficultyProfile } from "@/features/simulation-engine/difficulty-engine";
import {
  describeGeneratedPatient,
  generateDynamicScenarioSession,
} from "@/features/simulation-engine/dynamic-session-generator";
import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";
import type { ScenarioDefinition, SimulationSession, SyntheticPatient } from "@/features/simulation-engine/types";

const DIFFICULTIES: ScenarioDefinition["difficulty"][] = ["initial", "medium", "high", "expert"];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL");
}

function patientsAreSimilar(target: SyntheticPatient, distractor: SyntheticPatient): boolean {
  const targetFirst = normalize(target.firstName);
  const distractorFirst = normalize(distractor.firstName);
  return (
    normalize(target.lastName1) === normalize(distractor.lastName1) ||
    normalize(target.lastName2) === normalize(distractor.lastName2) ||
    targetFirst === distractorFirst ||
    targetFirst.slice(0, 4) === distractorFirst.slice(0, 4)
  );
}

function historicalSameMedicationDistractors(session: SimulationSession): number {
  const presentationById = new Map(session.presentations.map((item) => [item.id, item]));
  const relevant = session.prescriptions.filter((item) => item.relevantForCurrentWithdrawal);
  const primaryPresentation = relevant[0]
    ? presentationById.get(relevant[0].presentationId)
    : undefined;
  if (!primaryPresentation) return 0;

  return session.prescriptions.filter((prescription) => {
    if (prescription.relevantForCurrentWithdrawal) return false;
    return presentationById.get(prescription.presentationId)?.medicationId === primaryPresentation.medicationId;
  }).length;
}

function firstRelevantRecordPosition(session: SimulationSession): number | null {
  const relevantIds = new Set(
    session.prescriptions
      .filter((item) => item.relevantForCurrentWithdrawal)
      .map((item) => item.id),
  );
  const index = session.records.findIndex((record) =>
    record.prescriptionIds.some((id) => relevantIds.has(id)),
  );
  return index >= 0 ? index + 1 : null;
}

export function buildDifficultyReport() {
  const base = minimumScenarioFixtures.find((fixture) => fixture.id === "A");
  if (!base) throw new Error("Difficulty report requires minimum scenario A.");

  return DIFFICULTIES.map((difficulty) => {
    const definition: ScenarioDefinition = {
      ...base.definition,
      id: `difficulty-demo-${difficulty}`,
      difficulty,
    };
    const generated = generateDynamicScenarioSession(
      definition,
      `difficulty-demo:${difficulty}:2026-08-17`,
      arsenal2026SimulationCatalogs,
    );
    const session = generated.session;
    const target = session.patients.find((patient) => patient.id === session.patientId);
    const distractor = session.patients.find((patient) => patient.id !== session.patientId);
    const profile = getDifficultyProfile(difficulty);

    return {
      difficulty,
      profile,
      attempts: generated.attempts,
      recordCount: session.records.length,
      relevantPrescriptionCount: session.prescriptions.filter(
        (prescription) => prescription.relevantForCurrentWithdrawal,
      ).length,
      facilityCount: session.facilities.length,
      firstRelevantRecordPosition: firstRelevantRecordPosition(session),
      historicalSameMedicationDistractors: historicalSameMedicationDistractors(session),
      targetPatient: target ? describeGeneratedPatient(target) : null,
      distractorPatient: distractor ? describeGeneratedPatient(distractor) : null,
      similarPatientDistractor:
        target && distractor ? patientsAreSimilar(target, distractor) : false,
    };
  });
}
