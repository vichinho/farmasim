export type SimulationNodeType = "dialogue" | "choice" | "feedback" | "result";

export type SimulationChoice = {
  feedback: string;
  id: string;
  isCorrect: boolean;
  nextNodeId: string;
  text: string;
  xpReward: number;
};

type BaseSimulationNode = {
  id: string;
  text: string;
  type: SimulationNodeType;
};

export type DialogueNode = BaseSimulationNode & {
  characterName: string;
  type: "dialogue";
};

export type ChoiceNode = BaseSimulationNode & {
  choices: SimulationChoice[];
  prompt: string;
  type: "choice";
};

export type FeedbackNode = BaseSimulationNode & {
  type: "feedback";
};

export type ResultNode = BaseSimulationNode & {
  type: "result";
};

export type SimulationNode = DialogueNode | ChoiceNode | FeedbackNode | ResultNode;

export type SimulationScenario = {
  description: string;
  id: string;
  initialNodeId: string;
  nodes: SimulationNode[];
  title: string;
};

export type SimulationAnswer = {
  choiceId: string;
  isCorrect: boolean;
  nodeId: string;
  xpReward: number;
};

export type SimulationState = {
  answers: SimulationAnswer[];
  attemptId: string;
  completedAt: Date | null;
  correctAnswers: number;
  currentNodeId: string;
  earnedXp: number;
  incorrectAnswers: number;
  score: number;
  startedAt: Date;
};
