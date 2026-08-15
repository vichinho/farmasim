"use client";

import { Case001ExperienceV5 } from "@/features/training/case001-experience-v5";
import type { TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = {
  levelNumber: number;
  mode: TrainingMode;
  trainingCase: TrainingCase;
};

export function Case001ExperienceV6(props: Props) {
  return (
    <div className="farmasim-case001-v6">
      <style jsx global>{`
        .farmasim-case001-v6 {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .farmasim-case001-v6 [class~="snap-x"] > button {
          letter-spacing: -0.01em;
        }

        .farmasim-case001-v6 [class~="snap-x"] > button > span:last-child {
          font-weight: 700;
          line-height: 1.25;
        }

        @media (min-width: 1024px) {
          .farmasim-case001-v6 [class~="snap-x"] {
            display: grid !important;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 0.5rem;
            overflow-x: visible !important;
            scroll-snap-type: none !important;
          }

          .farmasim-case001-v6 [class~="snap-x"] > button {
            min-width: 0 !important;
            width: 100%;
            min-height: 4.75rem;
            padding: 0.7rem 0.65rem;
            gap: 0.6rem;
            border-radius: 1rem;
          }

          .farmasim-case001-v6 [class~="snap-x"] > button > span:first-child {
            width: 2rem;
            height: 2rem;
            min-width: 2rem;
            border-radius: 0.65rem;
          }

          .farmasim-case001-v6 [class~="snap-x"] > button > span:first-child::before {
            width: 18px;
            height: 18px;
          }

          .farmasim-case001-v6 [class~="snap-x"] > button > span:last-child {
            min-width: 0;
            overflow-wrap: anywhere;
            font-size: 0.66rem !important;
            line-height: 1.25 !important;
          }
        }

        @media (min-width: 1280px) {
          .farmasim-case001-v6 [class~="snap-x"] > button {
            padding-inline: 0.8rem;
            gap: 0.7rem;
          }

          .farmasim-case001-v6 [class~="snap-x"] > button > span:last-child {
            font-size: 0.69rem !important;
          }
        }
      `}</style>
      <Case001ExperienceV5 {...props} />
    </div>
  );
}
