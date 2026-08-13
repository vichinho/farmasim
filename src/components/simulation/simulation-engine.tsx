"use client";

import { useMemo, useState } from "react";

import { ChoiceNode } from "@/components/simulation/choice-node";
import { DialogueNode } from "@/components/simulation/dialogue-node";
import { FeedbackCard } from "@/components/simulation/feedback-card";
import { SimulationProgress } from "@/components/simulation/simulation-progress";
import { SimulationResult } from "@/components/simulation/simulation-result";
import { Card } from "@/components/ui/card";
import type { SimulationChoice, SimulationScenario, SimulationState } from "@/types/simulation";

type SimulationEngineProps = {
  scenario: SimulationScenario;
};

function createInitialState(scenario: SimulationScenario): SimulationState {
  return {
    answers: [],
    completedAt: null,
    correctAnswers: 0,
    currentNodeId: scenario.initialNodeId,
    earnedXp: 0,
    incorrectAnswers: 0,
    score: 0,
    startedAt: new Date(),
  };
}

export function SimulationEngine({ scenario }: SimulationEngineProps) {
  const [state, setState] = useState(() => createInitialState(scenario));
  const [selectedChoice, setSelectedChoice] = useState<SimulationChoice | null>(null);
  const currentNode = scenario.nodes.find((node) => node.id === state.currentNodeId);
  const totalChoices = useMemo(
    () => scenario.nodes.filter((node) => node.type === "choice").length,
    [scenario.nodes],
  );

  if (!currentNode) {
    return <Card>La práctica no pudo cargarse porque falta un nodo del escenario.</Card>;
  }

  function moveTo(nodeId: string) {
    const nextNode = scenario.nodes.find((node) => node.id === nodeId);

    setState((currentState) => ({
      ...currentState,
      completedAt:
        nextNode?.type === "result" ? currentState.completedAt ?? new Date() : currentState.completedAt,
      currentNodeId: nodeId,
    }));
  }

  function handleChoice(choice: SimulationChoice) {
    setSelectedChoice(choice);
    setState((currentState) => {
      const answers = [
        ...currentState.answers,
        {
          choiceId: choice.id,
          isCorrect: choice.isCorrect,
          nodeId: currentState.currentNodeId,
          xpReward: choice.xpReward,
        },
      ];
      const correctAnswers = currentState.correctAnswers + Number(choice.isCorrect);

      return {
        ...currentState,
        answers,
        correctAnswers,
        incorrectAnswers: currentState.incorrectAnswers + Number(!choice.isCorrect),
        earnedXp: currentState.earnedXp + choice.xpReward,
        score: Math.round((correctAnswers / answers.length) * 100),
      };
    });
  }

  function handleFeedbackContinue() {
    if (!selectedChoice) return;
    moveTo(selectedChoice.nextNodeId);
    setSelectedChoice(null);
  }

  function handleDialogueContinue() {
    const currentIndex = scenario.nodes.findIndex((node) => node.id === state.currentNodeId);
    const nextNode = scenario.nodes[currentIndex + 1];
    if (nextNode) moveTo(nextNode.id);
  }

  function restart() {
    setSelectedChoice(null);
    setState(createInitialState(scenario));
  }

  if (selectedChoice) {
    return <FeedbackCard choice={selectedChoice} onContinue={handleFeedbackContinue} />;
  }

  if (currentNode.type === "result") {
    const completedAt = state.completedAt ?? new Date();
    const elapsedSeconds = Math.max(
      0,
      Math.round((completedAt.getTime() - state.startedAt.getTime()) / 1000),
    );

    return (
      <SimulationResult
        correctAnswers={state.correctAnswers}
        elapsedSeconds={elapsedSeconds}
        earnedXp={state.earnedXp}
        incorrectAnswers={state.incorrectAnswers}
        onRestart={restart}
        score={state.score}
        text={currentNode.text}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SimulationProgress completedChoices={state.answers.length} totalChoices={totalChoices} />
      {currentNode.type === "dialogue" ? (
        <DialogueNode node={currentNode} onContinue={handleDialogueContinue} />
      ) : null}
      {currentNode.type === "choice" ? (
        <ChoiceNode node={currentNode} onChoose={handleChoice} />
      ) : null}
      {currentNode.type === "feedback" ? <Card>{currentNode.text}</Card> : null}
    </div>
  );
}
