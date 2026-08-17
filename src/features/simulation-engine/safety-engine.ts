import type {
  BarrierExecution,
  DeliverySafetyResult,
  DiscrepancyTransition,
  MedicationDiscrepancy,
  MedicationPresentation,
  PreparationItem,
  SafetyBarrierFailure,
  SimulationEvent,
  SimulationSession,
  SimulationState,
} from "@/features/simulation-engine/types";

const DOUBLE_CHECK_BARRIER_ID = "tens1-double-check";
const IDENTITY_RECHECK_BARRIER_ID = "identity-recheck";
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

function eventIds(events: readonly SimulationEvent[], type: SimulationEvent["type"]): string[] {
  return events.filter((event) => event.type === type).map((event) => event.id);
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
  events: readonly SimulationEvent[] = [],
): DeliverySafetyResult {
  const discrepancies = deriveDeliveryDiscrepancies(session, state);
  const medicationDiscrepancies = discrepancies.filter((item) => item.type !== "wrong_patient");
  const identityDiscrepancies = discrepancies.filter((item) => item.type === "wrong_patient");

  const doubleCheckExecuted = state.trayInspected && eventIds(events, "medication.inspected").length > 0;
  const identityRecheckExecuted = eventIds(events, "identity.rechecked").length > 0;

  const evaluatedBarriers: BarrierExecution[] = [
    {
      barrierId: DOUBLE_CHECK_BARRIER_ID,
      executed: doubleCheckExecuted,
      effective: doubleCheckExecuted && medicationDiscrepancies.length === 0,
      discrepancyIds: medicationDiscrepancies.map((item) => item.id),
    },
    {
      barrierId: IDENTITY_RECHECK_BARRIER_ID,
      executed: identityRecheckExecuted,
      effective: identityRecheckExecuted && identityDiscrepancies.length === 0,
      discrepancyIds: identityDiscrepancies.map((item) => item.id),
    },
  ];

  const barrierFailures: SafetyBarrierFailure[] = [];

  if (medicationDiscrepancies.length > 0 && (!doubleCheckExecuted || medicationDiscrepancies.length > 0)) {
    barrierFailures.push({
      id: `${session.id}:barrier-failure:${DOUBLE_CHECK_BARRIER_ID}`,
      barrierId: DOUBLE_CHECK_BARRIER_ID,
      discrepancyIds: medicationDiscrepancies.map((item) => item.id),
      evidenceEventIds: [
        ...eventIds(events, "tray.inspected"),
        ...eventIds(events, "medication.inspected"),
      ],
    });
  }

  if (identityDiscrepancies.length > 0 && (!identityRecheckExecuted || identityDiscrepancies.length > 0)) {
    barrierFailures.push({
      id: `${session.id}:barrier-failure:${IDENTITY_RECHECK_BARRIER_ID}`,
      barrierId: IDENTITY_RECHECK_BARRIER_ID,
      discrepancyIds: identityDiscrepancies.map((item) => item.id),
      evidenceEventIds: eventIds(events, "identity.rechecked"),
    });
  }

  const blockingDiscrepancyIds = discrepancies
    .filter((discrepancy) => discrepancy.status === "active")
    .map((discrepancy) => discrepancy.id);

  evaluatedBarriers.push({
    barrierId: FINAL_DELIVERY_BARRIER_ID,
    executed: state.deliveryAttempted,
    effective: state.deliveryAttempted && blockingDiscrepancyIds.length > 0,
    discrepancyIds: blockingDiscrepancyIds,
  });

  const discrepancyTransitions: DiscrepancyTransition[] = [];

  if (state.deliveryAttempted && blockingDiscrepancyIds.length > 0) {
    for (const discrepancy of discrepancies) {
      if (discrepancy.status !== "active") continue;

      discrepancyTransitions.push({
        discrepancyId: discrepancy.id,
        from: "active",
        to: "intercepted",
        stage: "final_delivery_check",
        actorId: "system",
        barrierId: FINAL_DELIVERY_BARRIER_ID,
      });

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
    barrierFailures,
    discrepancyTransitions,
  };
}
