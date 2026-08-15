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

        .farmasim-unified-case section[aria-labelledby="realistic-scene-heading"] [class~="right-5"][class~="top-5"] {
          display: none !important;
        }

        .farmasim-unified-case section[aria-labelledby="realistic-scene-heading"] [class~="bottom-4"][class~="z-40"] {
          left: 1.25rem !important;
          right: auto !important;
          width: min(92%, 26rem) !important;
          transform: none !important;
        }

        .farmasim-unified-case section[aria-labelledby="realistic-scene-heading"] [class~="bottom-4"][class~="z-40"] > div {
          max-height: 23rem !important;
          border-radius: 1.35rem !important;
          box-shadow: 0 18px 45px rgba(17, 24, 39, 0.14) !important;
        }

        .farmasim-unified-case section[aria-labelledby="realistic-scene-heading"] [class~="bottom-4"][class~="z-40"] h3 {
          font-size: 1.35rem !important;
          line-height: 1.15 !important;
        }

        .farmasim-unified-case section[aria-labelledby="realistic-scene-heading"] [class~="bottom-4"][class~="z-40"] p {
          font-size: 0.86rem;
          line-height: 1.45;
        }

        @media (min-width: 1280px) {
          .farmasim-unified-case section[aria-labelledby="realistic-scene-heading"] > div > div:nth-child(2) {
            grid-template-columns: minmax(0, 1fr) 27.5rem !important;
          }

          .farmasim-unified-case section[aria-labelledby="realistic-scene-heading"] [class~="min-h-[650px]"] {
            min-height: 720px !important;
          }
        }
      `}</style>
      <TrainingSession {...props} />
    </div>
  );
}
