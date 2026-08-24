export const DUA_HINT_LIMIT = 3;

const caseHints: Record<string, readonly [string, string, string]> = {
  "case-001-ambulatory-dispensing": [
    "Antes de avanzar, confirma que identidad, prescripciones vigentes y productos preparados cuentan la misma historia.",
    "La identidad se comprueba más de una vez: al consultar el registro y nuevamente antes de entregar.",
    "Revisa cada producto de la bandeja contra su línea de prescripción y confirma que entregaste todas las indicaciones necesarias.",
  ],
  "case-002-concentration-reinforcement": [
    "No compares solo el nombre del medicamento: revisa también la concentración indicada y la presentación seleccionada.",
    "Lee el valor y la unidad completos tanto en la prescripción como en el producto almacenado; una cifra parecida no implica equivalencia.",
    "Antes de agregar el producto a la bandeja, contrasta lado a lado medicamento, concentración y forma farmacéutica.",
  ],
  "case-003-concentration-reinforcement": [
    "Abrir una prescripción no basta. Comprueba su estado y decide qué corresponde hacer antes de preparar o entregar.",
    "Distingue entre una prescripción disponible para retiro y otra que ya fue dispensada, está pendiente o requiere revisión.",
    "Confirma el estado de todas las prescripciones relevantes antes de decidir cuáles productos deben llegar a la bandeja.",
  ],
  "case-004-concentration-reinforcement": [
    "Haz una pausa antes del cierre y reconstruye la secuencia: identidad, prescripción, preparación y verificación final.",
    "Comprueba que la identidad del registro corresponda al documento y vuelve a validarla cuando recibas la bandeja.",
    "En el último control, revisa la bandeja línea por línea y no finalices sin entregar las indicaciones correspondientes.",
  ],
  "case-005-storage-review": [
    "En cada gaveta contrasta código, nombre, condición física y stock; después registra solo lo que realmente observas.",
    "Una etiqueta deteriorada o un stock bajo deben quedar descritos antes de marcar la gaveta como completada.",
    "Si observas una condición no prevista, regístrala sin interpretarla y deriva la revisión al QF según el protocolo aplicable.",
  ],
  "case-006-multiple-errors": [
    "Un primer hallazgo no descarta otros. Cruza por separado producto, presentación y cantidad antes de cerrar.",
    "Compara todas las líneas de la bandeja: encontrar una diferencia no significa que el resto de la preparación esté correcto.",
    "Activa la barrera y solicita corrección para cada discrepancia detectada antes de intentar el cierre del caso.",
  ],
  "case-007-expert-mode": [
    "Antes de entregar, realiza una última lectura completa sin asumir que una verificación anterior sigue siendo suficiente.",
    "Reconstruye la trazabilidad completa: identidad, estado de cada prescripción, preparación recibida y comparación final.",
    "El cierre experto exige reidentificar al paciente y completar las indicaciones, incluso cuando la bandeja parece correcta.",
  ],
};

const fallbackHints = [
  "Detente un momento y vuelve a contrastar los datos visibles antes de continuar.",
  "Revisa el caso siguiendo el orden de la actividad y confirma cada dato en su fuente.",
  "Antes del cierre, realiza una verificación final sin depender de lo que recuerdas haber revisado.",
] as const;

export function duaHintsForCase(caseId: string) {
  return caseHints[caseId]
    ?? fallbackHints;
}

export function duaHintAvailabilityLabel(hintsUsed: number) {
  const remaining = Math.max(0, DUA_HINT_LIMIT - hintsUsed);
  if (remaining === 0) return "3 pistas utilizadas";
  return `${remaining} ${remaining === 1 ? "pista disponible" : "pistas disponibles"}`;
}
