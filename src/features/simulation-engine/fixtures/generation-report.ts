import { technicalSimulationCatalogs } from "@/features/simulation-engine/catalogs";
import {
  describeGeneratedPatient,
  generateDynamicScenarioSession,
} from "@/features/simulation-engine/dynamic-session-generator";
import { minimumScenarioFixtures } from "@/features/simulation-engine/fixtures/minimum-scenarios";
import type { SimulationSession } from "@/features/simulation-engine/types";

function semanticSignature(session: SimulationSession) {
  return {
    patientId: session.patientId,
    initialClinicalSystemState: session.initialClinicalSystemState,
    records: session.records.map((record) => ({
      facilityId: record.facilityId,
      prescriptionIds: record.prescriptionIds,
    })),
    prescriptions: session.prescriptions.map((prescription) => ({
      presentationId: prescription.presentationId,
      quantity: prescription.quantity,
      status: prescription.status,
      facilityId: prescription.facilityId,
      relevantForCurrentWithdrawal: prescription.relevantForCurrentWithdrawal,
      issuedAt: prescription.issuedAt,
    })),
    preparation: session.preparation,
    drawers: session.drawers,
  };
}

function sessionPreview(session: SimulationSession) {
  const patient = session.patients.find((item) => item.id === session.patientId);
  const relevantPrescriptions = session.prescriptions.filter(
    (prescription) => prescription.relevantForCurrentWithdrawal,
  );

  return {
    id: session.id,
    seed: session.seed,
    generatedAt: session.generatedAt,
    patient: patient
      ? {
          id: patient.id,
          name: describeGeneratedPatient(patient),
          syntheticRut: patient.syntheticRut,
          age: patient.age,
        }
      : null,
    playerRole: session.playerRole,
    mode: session.mode,
    initialClinicalSystemState: session.initialClinicalSystemState,
    recordCount: session.records.length,
    relevantPrescriptions: relevantPrescriptions.map((prescription) => ({
      id: prescription.id,
      presentationId: prescription.presentationId,
      quantity: prescription.quantity,
      facilityId: prescription.facilityId,
    })),
    preparation: session.preparation,
    drawers: session.drawers,
  };
}

export function buildGenerationReport() {
  return minimumScenarioFixtures.map((fixture) => {
    const seed = `dynamic-demo:${fixture.definition.id}:alpha`;
    const replaySeed = seed;
    const variantSeed = `dynamic-demo:${fixture.definition.id}:beta`;

    const first = generateDynamicScenarioSession(
      fixture.definition,
      seed,
      technicalSimulationCatalogs,
    );
    const replay = generateDynamicScenarioSession(
      fixture.definition,
      replaySeed,
      technicalSimulationCatalogs,
    );
    const variant = generateDynamicScenarioSession(
      fixture.definition,
      variantSeed,
      technicalSimulationCatalogs,
    );

    const firstSignature = JSON.stringify(semanticSignature(first.session));
    const replaySignature = JSON.stringify(semanticSignature(replay.session));
    const variantSignature = JSON.stringify(semanticSignature(variant.session));

    return {
      id: fixture.id,
      title: fixture.title,
      definitionId: fixture.definition.id,
      deterministicReplay: firstSignature === replaySignature,
      variantChangesContent: firstSignature !== variantSignature,
      attempts: first.attempts,
      generated: sessionPreview(first.session),
      variant: sessionPreview(variant.session),
    };
  });
}
