const caseHints: Record<string, string> = {
  "case-001-ambulatory-dispensing":
    "Antes de avanzar, confirma que identidad, prescripciones vigentes y productos preparados cuentan la misma historia.",
  "case-002-concentration-reinforcement":
    "No compares solo el nombre del medicamento: revisa también la concentración indicada y la presentación seleccionada.",
  "case-003-concentration-reinforcement":
    "Abrir una prescripción no basta. Comprueba su estado y decide qué corresponde hacer antes de preparar o entregar.",
  "case-004-concentration-reinforcement":
    "Haz una pausa antes del cierre y reconstruye la secuencia: identidad, prescripción, preparación y verificación final.",
  "case-005-storage-review":
    "En cada gaveta contrasta código, nombre, condición física y stock; después registra solo lo que realmente observas.",
  "case-006-multiple-errors":
    "Un primer hallazgo no descarta otros. Cruza por separado producto, presentación y cantidad antes de cerrar.",
  "case-007-expert-mode":
    "Antes de entregar, realiza una última lectura completa sin asumir que una verificación anterior sigue siendo suficiente.",
};

export function duaHintForCase(caseId: string) {
  return caseHints[caseId]
    ?? "Detente un momento y vuelve a contrastar los datos visibles antes de continuar.";
}

export function duaHintAvailabilityLabel(hintUsed: boolean) {
  return hintUsed ? "Pista utilizada" : "1 pista disponible";
}
