"use client";

import { Case001ExperienceV4 } from "@/features/training/case001-experience-v4";
import type { TrainingCase, TrainingMode } from "@/types/training-simulation";

type Props = {
  levelNumber: number;
  mode: TrainingMode;
  trainingCase: TrainingCase;
};

export function Case001ExperienceV5(props: Props) {
  return (
    <div className="farmasim-case001-v5">
      <style jsx global>{`
        .farmasim-case001-v5 [class~="snap-x"] > button > span:first-child {
          position: relative;
          font-size: 0 !important;
          color: inherit;
        }

        .farmasim-case001-v5 [class~="snap-x"] > button > span:first-child::before {
          content: "";
          display: block;
          width: 21px;
          height: 21px;
          background: currentColor;
          mask-repeat: no-repeat;
          mask-position: center;
          mask-size: contain;
          -webkit-mask-repeat: no-repeat;
          -webkit-mask-position: center;
          -webkit-mask-size: contain;
        }

        /* Documento / identificación */
        .farmasim-case001-v5 [class~="snap-x"] > button:nth-child(1) > span:first-child::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='16' rx='2'/%3E%3Ccircle cx='8.5' cy='10' r='2'/%3E%3Cpath d='M5.5 16c.8-2 2-3 3-3s2.2 1 3 3M14 9h4M14 13h4M14 17h3'/%3E%3C/svg%3E");
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='16' rx='2'/%3E%3Ccircle cx='8.5' cy='10' r='2'/%3E%3Cpath d='M5.5 16c.8-2 2-3 3-3s2.2 1 3 3M14 9h4M14 13h4M14 17h3'/%3E%3C/svg%3E");
        }

        /* Computador */
        .farmasim-case001-v5 [class~="snap-x"] > button:nth-child(2) > span:first-child::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='13' rx='2'/%3E%3Cpath d='M8 21h8M12 17v4'/%3E%3C/svg%3E");
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='13' rx='2'/%3E%3Cpath d='M8 21h8M12 17v4'/%3E%3C/svg%3E");
        }

        /* Prescripciones */
        .farmasim-case001-v5 [class~="snap-x"] > button:nth-child(3) > span:first-child::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 3h9l4 4v14H6z'/%3E%3Cpath d='M15 3v5h5M9 12h7M9 16h7'/%3E%3C/svg%3E");
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 3h9l4 4v14H6z'/%3E%3Cpath d='M15 3v5h5M9 12h7M9 16h7'/%3E%3C/svg%3E");
        }

        /* Bandeja / medicamentos */
        .farmasim-case001-v5 [class~="snap-x"] > button:nth-child(4) > span:first-child::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 17h18l-1 3H4zM5 17l1-7h12l1 7'/%3E%3Crect x='8' y='6' width='3' height='7' rx='1'/%3E%3Cpath d='M14 9h3M15.5 7.5v3'/%3E%3C/svg%3E");
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 17h18l-1 3H4zM5 17l1-7h12l1 7'/%3E%3Crect x='8' y='6' width='3' height='7' rx='1'/%3E%3Cpath d='M14 9h3M15.5 7.5v3'/%3E%3C/svg%3E");
        }

        /* Verificación de identidad */
        .farmasim-case001-v5 [class~="snap-x"] > button:nth-child(5) > span:first-child::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='9' cy='8' r='3'/%3E%3Cpath d='M3.5 20c.7-4 2.5-6 5.5-6 2 0 3.5.9 4.4 2.4M15 18l2 2 4-5'/%3E%3C/svg%3E");
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='9' cy='8' r='3'/%3E%3Cpath d='M3.5 20c.7-4 2.5-6 5.5-6 2 0 3.5.9 4.4 2.4M15 18l2 2 4-5'/%3E%3C/svg%3E");
        }

        /* Indicaciones */
        .farmasim-case001-v5 [class~="snap-x"] > button:nth-child(6) > span:first-child::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 5h16v11H9l-5 4z'/%3E%3Cpath d='M8 9h8M8 13h5'/%3E%3C/svg%3E");
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 5h16v11H9l-5 4z'/%3E%3Cpath d='M8 9h8M8 13h5'/%3E%3C/svg%3E");
        }

        /* Apoyo QF */
        .farmasim-case001-v5 [class~="snap-x"] > button:nth-child(7) > span:first-child::before {
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='9' cy='8' r='3'/%3E%3Cpath d='M3.5 20c.7-4 2.5-6 5.5-6 2.1 0 3.6.9 4.5 2.5M18 12v6M15 15h6'/%3E%3C/svg%3E");
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='9' cy='8' r='3'/%3E%3Cpath d='M3.5 20c.7-4 2.5-6 5.5-6 2.1 0 3.6.9 4.5 2.5M18 12v6M15 15h6'/%3E%3C/svg%3E");
        }

        .farmasim-case001-v5 [class~="snap-x"] > button:hover > span:first-child {
          transform: translateY(-1px);
        }
      `}</style>
      <Case001ExperienceV4 {...props} />
    </div>
  );
}
