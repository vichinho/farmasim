"use client";

import { TrainingSession } from "@/features/training/training-session";
import type { TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = {
  levelNumber: number;
  mode: TrainingMode;
  trainingCase: TrainingCase;
};

export function RemainingCaseExperience(props: Props) {
  return (
    <div className="farmasim-unified-case">
      <style jsx global>{`
        .farmasim-unified-case > .space-y-4 > :first-child {
          display: none !important;
        }

        .farmasim-unified-case > .space-y-4 {
          gap: 0 !important;
        }

        .farmasim-unified-case section[aria-labelledby="realistic-scene-heading"] {
          margin: 0 !important;
        }

        .farmasim-unified-case section[aria-labelledby="realistic-scene-heading"] > div {
          border-radius: 1.8rem !important;
        }

        @media (min-width: 1280px) {
          .farmasim-unified-case section[aria-labelledby="realistic-scene-heading"] > div > div:nth-child(2) {
            grid-template-columns: minmax(0, 1fr) 27.5rem !important;
          }
        }
      `}</style>
      <TrainingSession {...props} />
    </div>
  );
}
