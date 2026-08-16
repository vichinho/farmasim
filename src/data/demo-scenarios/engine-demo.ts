import type { SimulationScenario } from "@/types/simulation";

export const engineDemoScenario: SimulationScenario = {
  id: "engine-demo",
  title: "Práctica de comunicación",
  description:
    "Escenario técnico y completamente ficticio para demostrar el motor de decisiones de FarmaVerse.",
  initialNodeId: "welcome",
  nodes: [
    {
      id: "welcome",
      type: "dialogue",
      characterName: "Persona ficticia",
      text: "Hola. Tengo una consulta general y me gustaría explicarla con calma.",
    },
    {
      id: "listen",
      type: "choice",
      prompt: "¿Cómo quieres continuar la conversación?",
      text: "Elige una alternativa. Esta práctica no representa un protocolo ni una instrucción profesional.",
      choices: [
        {
          id: "listen-first",
          text: "Escuchar y pedir que explique su consulta.",
          isCorrect: true,
          feedback: "Correcto. Antes de avanzar, conviene comprender la solicitud con atención.",
          xpReward: 50,
          nextNodeId: "context",
        },
        {
          id: "assume",
          text: "Asumir de inmediato cuál es la consulta.",
          isCorrect: false,
          feedback: "Esta decisión puede llevar a malentendidos. La práctica favorece escuchar primero.",
          xpReward: 0,
          nextNodeId: "context",
        },
      ],
    },
    {
      id: "context",
      type: "dialogue",
      characterName: "Persona ficticia",
      text: "Gracias. Me ayuda que me des un momento para explicar el contexto.",
    },
    {
      id: "close",
      type: "choice",
      prompt: "¿Cómo cierras esta práctica?",
      text: "Selecciona la alternativa que mejor mantiene una comunicación clara y respetuosa.",
      choices: [
        {
          id: "summarize",
          text: "Confirmar que entendiste y explicar el siguiente paso de la práctica.",
          isCorrect: true,
          feedback: "Correcto. Resumir lo conversado ayuda a mantener una interacción clara.",
          xpReward: 50,
          nextNodeId: "result",
        },
        {
          id: "end-abruptly",
          text: "Finalizar la conversación sin confirmar lo conversado.",
          isCorrect: false,
          feedback: "Esta opción deja la conversación incompleta. La práctica favorece confirmar el cierre.",
          xpReward: 0,
          nextNodeId: "result",
        },
      ],
    },
    {
      id: "result",
      type: "result",
      text: "Has completado una práctica técnica del motor de simulaciones.",
    },
  ],
};
