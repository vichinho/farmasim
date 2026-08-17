import type {
  BarrierExecution,
  DeliverySafetyResult,
  MedicationDiscrepancy,
  MedicationPresentation,
  PreparationItem,
  SimulationSession,
  SimulationState,
} from "@/features/simulation-engine/types";

const FINAL_DELIVERY_BARRIER_ID = "final-delivery-system-guard";

function findPresentation(session: SimulationSession, id: string): MedicationPresentation | undefined {
  return session.presentations.find((presentation) => presentation.id === id);
}

function sumQuantity(items: PreparationItem[], presentationId: string): number {
  return items
    .filter((item) => item.presentationId === presentationId)
    .reduce((total, item) => total + item.quantity, 0);
}

function createDiscrepancy(
  session: SimulationSession,
  index: number,
  input: Omit<MedicationDiscrepancy, "id" | "status" | "reachedPatient">,
): MedicationDiscrepancy {
  return {
    id: `${session.id}:discrepancy:${index}`,
    status: "active",
    reachedPatient: false,
    ...input,
  };
}

export function deriveDeliveryDiscrepancies(
  session: SimulationSession,
  state: SimulationState,
): MedicationDiscrepancy[] {
  const discrepancies: MedicationDiscrepancy[] = [];
  let index = 0;

  if (state.activePatientId && state.activePatientId !== session.patientId) {
    discrepancies.push(
      createDiscrepancy(session, ++index, {
        type: "wrong_patient",
        originStage: "clinical-system",
        expected: { patientId: session.patientId },
        actual: { patientId: state.activePatientId },
      }),
    );
  }

  for (const requested of session.preparation.requestedItems) {
    const exactPreparedQuantity = sumQuantity(session.preparation.preparedItems, requested.presentationId);
    const requestedPresentation = findPresentation(session, requested.presentationId);

    if (!requestedPresentation) continue;

    if (exactPreparedQuantity === 0) {
      const alternative = session.preparation.preparedItems
        .map((item) => ({ item, presentation: findPresentation(session, item.presentationId) }))
        .find(({ presentation }) => presentation?.medicationId === requestedPresentation.medicationId);

      if (!alternative?.presentation) {
        discrepancies.push(
          createDiscrepancy(session, ++index, {
            type: "omission",
            originStage: "preparation",
            expected: { presentationId: requested.presentationId, quantity: requested.quantity },
            actual: { quantity: 0 },
          }),
        );
        continue;
      }

      const type =
        alternative.presentation.strength !== requestedPresentation.strength
          ? "wrong_strength"
          : alternative.presentation.pharmaceuticalForm !== requestedPresentation.pharmaceuticalForm
            ? "wrong_form"
            : "wrong_medication";

      discrepancies.push(
        createDiscrepancy(session, ++index, {
          type,
          originStage: "preparation",
          createdBy: session.preparation.preparedBy,
          expected: {
            presentationId: requestedPresentation.id,
            medicationId: requestedPresentation.medicationId,
            strength: requestedPresentation.strength,
            form: requestedPresentation.pharmaceuticalForm,
            quantity: requested.quantity,
          },
          actual: {
            presentationId: alternative.presentation.id,
            medicationId: alternative.presentation.medicationId,
            strength: alternative.presentation.strength,
            form: alternative.presentation.pharmaceuticalForm,
            quantity: alternative.item.quantity,
          },
        }),
      );
      continue;
    }

    if (exactPreparedQuantity !== requested.quantity) {
      discrepancies.push(
        createDiscrepancy(session, ++index, {
          type: "wrong_quantity",
          originStage: "preparation",
          createdBy: session.preparation.preparedBy,
          expected: { presentationId: requested.presentationId, quantity: requested.quantity },
          actual: { presentationId: requested.presentationId, quantity: exactPreparedQuantity },
        }),
      );
    }
  }

  for (const prepared of session.preparation.preparedItems) {
    const requestedQuantity = sumQuantity(session.preparation.requestedItems, prepared.presentationId);
    if (requestedQuantity === 0) {
      const preparedPresentation = findPresentation(session, prepared.presentationId);
      const matchesRequestedMedication = session.preparation.requestedItems.some((requested) => {
        const requestedPresentation = findPresentation(session, requested.presentationId);
        return requestedPresentation?.medicationId === preparedPresentation?.medicationId;
      });

      if (!matchesRequestedMedication) {
        discrepancies.push(
          createDiscrepancy(session, ++index, {
            type: "extra_product",
            originStage: "preparation",
            createdBy: session.preparation.preparedBy,
            actual: { presentationId: prepared.presentationId, quantity: prepared.quantity },
          }),
        );
      }
    }
  }

  return discrepancies;
}

export function evaluateDeliverySafety(
  session: SimulationSession,
  state: SimulationState,
): DeliverySafetyResult {
  const discrepancies = deriveDeliveryDiscrepancies(session, state);
  const blockingDiscrepancyIds = discrepancies.map((discrepancy) => discrepancy.id);

  const evaluatedBarriers: BarrierExecution[] = [
    {
      barrierId: FINAL_DELIVERY_BARRIER_ID,
      executed: state.deliveryAttempted,
      effective: state.deliveryAttempted && blockingDiscrepancyIds.length > 0,
      discrepancyIds: blockingDiscrepancyIds,
    },
  ];

  if (state.deliveryAttempted && blockingDiscrepancyIds.length > 0) {
    for (const discrepancy of discrepancies) {
      discrepancy.status = "intercepted";
      discrepancy.detectedAt = "final_delivery_check";
      discrepancy.detectedBy = "system";
      discrepancy.interceptedByBarrierId = FINAL_DELIVERY_BARRIER_ID;
    }
  }

  return {
    allowed: blockingDiscrepancyIds.length === 0,
    discrepancies,
    blockingDiscrepancyIds,
    evaluatedBarriers,
  };
}
