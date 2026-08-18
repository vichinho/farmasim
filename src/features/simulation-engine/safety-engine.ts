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

function aggregateQuantities(items: readonly PreparationItem[]): Map<string, number> {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(item.presentationId, (quantities.get(item.presentationId) ?? 0) + item.quantity);
  }
  return quantities;
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

  const requestedQuantities = aggregateQuantities(session.preparation.requestedItems);
  const preparedQuantities = aggregateQuantities(session.preparation.preparedItems);

  for (const [presentationId, requestedQuantity] of requestedQuantities) {
    const requestedPresentation = findPresentation(session, presentationId);
    if (!requestedPresentation) continue;

    const exactPreparedQuantity = preparedQuantities.get(presentationId) ?? 0;
    const alternatives = [...preparedQuantities.entries()]
      .map(([preparedPresentationId, quantity]) => ({
        presentation: findPresentation(session, preparedPresentationId),
        quantity,
      }))
      .filter(
        (candidate): candidate is { presentation: MedicationPresentation; quantity: number } =>
          Boolean(
            candidate.presentation &&
              candidate.presentation.id !== requestedPresentation.id &&
              candidate.presentation.medicationId === requestedPresentation.medicationId,
          ),
      );

    const alternativeQuantity = alternatives.reduce((total, item) => total + item.quantity, 0);
    const sameMedicationPreparedQuantity = exactPreparedQuantity + alternativeQuantity;

    if (alternatives.length > 0) {
      const alternative = alternatives[0];
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
            quantity: requestedQuantity,
          },
          actual: {
            presentationId: alternative.presentation.id,
            medicationId: alternative.presentation.medicationId,
            strength: alternative.presentation.strength,
            form: alternative.presentation.pharmaceuticalForm,
            quantity: alternativeQuantity,
          },
        }),
      );

      if (sameMedicationPreparedQuantity !== requestedQuantity) {
        discrepancies.push(
          createDiscrepancy(session, ++index, {
            type: "wrong_quantity",
            originStage: "preparation",
            createdBy: session.preparation.preparedBy,
            expected: { presentationId, quantity: requestedQuantity },
            actual: { medicationId: requestedPresentation.medicationId, quantity: sameMedicationPreparedQuantity },
          }),
        );
      }
      continue;
    }

    if (exactPreparedQuantity === 0) {
      discrepancies.push(
        createDiscrepancy(session, ++index, {
          type: "omission",
          originStage: "preparation",
          expected: { presentationId, quantity: requestedQuantity },
          actual: { quantity: 0 },
        }),
      );
      continue;
    }

    if (exactPreparedQuantity !== requestedQuantity) {
      discrepancies.push(
        createDiscrepancy(session, ++index, {
          type: "wrong_quantity",
          originStage: "preparation",
          createdBy: session.preparation.preparedBy,
          expected: { presentationId, quantity: requestedQuantity },
          actual: { presentationId, quantity: exactPreparedQuantity },
        }),
      );
    }
  }

  const requestedMedicationIds = new Set(
    [...requestedQuantities.keys()]
      .map((presentationId) => findPresentation(session, presentationId)?.medicationId)
      .filter((id): id is string => typeof id === "string"),
  );

  for (const [presentationId, preparedQuantity] of preparedQuantities) {
    if ((requestedQuantities.get(presentationId) ?? 0) > 0) continue;

    const preparedPresentation = findPresentation(session, presentationId);
    if (!preparedPresentation || requestedMedicationIds.has(preparedPresentation.medicationId)) continue;

    discrepancies.push(
      createDiscrepancy(session, ++index, {
        type: "extra_product",
        originStage: "preparation",
        createdBy: session.preparation.preparedBy,
        actual: { presentationId, quantity: preparedQuantity },
      }),
    );
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

  if (medicationDiscrepancies.length > 0) {
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

  if (identityDiscrepancies.length > 0) {
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
