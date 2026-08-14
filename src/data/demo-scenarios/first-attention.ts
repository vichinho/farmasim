import type { SimulationScenario } from "@/types/simulation";

export const firstAttentionScenario: SimulationScenario = {
  id: "first-attention",
  title: "Tu primera atención",
  description:
    "Escenario completamente ficticio para practicar una atención clara y respetuosa. No representa un protocolo farmacéutico.",
  initialNodeId: "patient-arrival",
  nodes: [
    {
      id: "patient-arrival",
      type: "dialogue",
      characterName: "Paciente virtual",
      text: "Hola, necesito ayuda con un medicamento.",
    },
    {
      id: "first-response",
      type: "choice",
      prompt: "¿Cómo respondes inicialmente?",
      text: "Selecciona una alternativa para continuar la atención ficticia.",
      choices: [
        {
          id: "greet-and-listen",
          text: "Saludar y solicitar más información.",
          isCorrect: true,
          feedback:
            "Correcto. Antes de ejecutar una acción necesitamos entender la solicitud del usuario.",
          xpReward: 25,
          nextNodeId: "patient-explains",
        },
        {
          id: "search-immediately",
          text: "Buscar un producto inmediatamente.",
          isCorrect: false,
          feedback:
            "Esta alternativa se adelanta a la conversación. En esta demostración conviene comprender primero la solicitud.",
          xpReward: 0,
          nextNodeId: "patient-explains",
        },
        {
          id: "ignore-request",
          text: "Ignorar la consulta.",
          isCorrect: false,
          feedback:
            "Ignorar la consulta interrumpe la atención. Esta práctica favorece una respuesta respetuosa.",
          xpReward: 0,
          nextNodeId: "patient-explains",
        },
      ],
    },
    {
      id: "patient-explains",
      type: "dialogue",
      characterName: "Paciente virtual",
      text: "Gracias. Quisiera explicar mejor lo que necesito antes de continuar.",
    },
    {
      id: "active-listening",
      type: "choice",
      prompt: "¿Qué haces mientras la persona explica su solicitud?",
      text: "Elige la acción que favorece una comunicación ordenada.",
      choices: [
        {
          id: "listen-without-interrupting",
          text: "Escuchar con atención y sin interrumpir.",
          isCorrect: true,
          feedback:
            "Correcto. Escuchar permite reunir el contexto antes de decidir el siguiente paso de esta práctica.",
          xpReward: 25,
          nextNodeId: "patient-finishes",
        },
        {
          id: "interrupt-explanation",
          text: "Interrumpir para terminar más rápido.",
          isCorrect: false,
          feedback:
            "Interrumpir puede dejar información sin comprender. La demostración favorece una escucha atenta.",
          xpReward: 0,
          nextNodeId: "patient-finishes",
        },
        {
          id: "look-away",
          text: "Desatender la conversación.",
          isCorrect: false,
          feedback:
            "Desatender la conversación dificulta comprender la solicitud y mantener un trato respetuoso.",
          xpReward: 0,
          nextNodeId: "patient-finishes",
        },
      ],
    },
    {
      id: "patient-finishes",
      type: "dialogue",
      characterName: "Paciente virtual",
      text: "Eso era lo que quería comentar. ¿Se entendió mi solicitud?",
    },
    {
      id: "confirm-understanding",
      type: "choice",
      prompt: "¿Cómo compruebas que comprendiste?",
      text: "Esta decisión evalúa solamente comunicación, no conocimientos farmacéuticos.",
      choices: [
        {
          id: "summarize-request",
          text: "Resumir la solicitud y pedir confirmación.",
          isCorrect: true,
          feedback:
            "Correcto. Confirmar lo entendido ayuda a detectar posibles malentendidos antes de continuar.",
          xpReward: 25,
          nextNodeId: "patient-confirms",
        },
        {
          id: "assume-understanding",
          text: "Asumir que entendiste sin confirmarlo.",
          isCorrect: false,
          feedback:
            "Asumir puede mantener un malentendido. En esta práctica es mejor confirmar lo conversado.",
          xpReward: 0,
          nextNodeId: "patient-confirms",
        },
        {
          id: "change-subject",
          text: "Cambiar de tema sin responder.",
          isCorrect: false,
          feedback:
            "Cambiar de tema deja la solicitud sin confirmar y rompe la continuidad de la atención.",
          xpReward: 0,
          nextNodeId: "patient-confirms",
        },
      ],
    },
    {
      id: "patient-confirms",
      type: "dialogue",
      characterName: "Paciente virtual",
      text: "Sí, eso es. Gracias por confirmar lo que expliqué.",
    },
    {
      id: "close-attention",
      type: "choice",
      prompt: "¿Cómo cierras esta demostración?",
      text: "No se evaluarán procedimientos ni recomendaciones sobre medicamentos.",
      choices: [
        {
          id: "explain-next-step",
          text: "Explicar con claridad que revisarás el siguiente paso de la atención.",
          isCorrect: true,
          feedback:
            "Correcto. Comunicar el siguiente paso mantiene a la persona informada sin inventar una respuesta profesional.",
          xpReward: 25,
          nextNodeId: "result",
        },
        {
          id: "leave-without-closing",
          text: "Alejarte sin explicar qué ocurrirá.",
          isCorrect: false,
          feedback:
            "La atención queda inconclusa. Esta práctica favorece comunicar claramente cómo continuará la interacción.",
          xpReward: 0,
          nextNodeId: "result",
        },
        {
          id: "invent-an-answer",
          text: "Improvisar una respuesta para finalizar rápidamente.",
          isCorrect: false,
          feedback:
            "No corresponde improvisar información. Revisa las fuentes documentales del escenario y deriva cualquier situación no prevista según el protocolo aplicable.",
          xpReward: 0,
          nextNodeId: "result",
        },
      ],
    },
    {
      id: "result",
      type: "result",
      text: "Completaste tu primera atención ficticia. Tu resultado se guardará en tu progreso.",
    },
  ],
};
