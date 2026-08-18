// Generated from ARSENAL 2026.xlsx, sheet "ARSENAL HT 2025".
// Scope: rows explicitly marked "X" in ATENCIÓN ABIERTA.
// Do not edit medication rows manually; regenerate from the source workbook when the arsenal changes.

import { ARSENAL_2026_OPEN_CARE_CHUNK_01 } from "@/features/simulation-engine/arsenal/generated/open-care-chunk-01";
import { ARSENAL_2026_OPEN_CARE_CHUNK_02 } from "@/features/simulation-engine/arsenal/generated/open-care-chunk-02";
import { ARSENAL_2026_OPEN_CARE_CHUNK_03 } from "@/features/simulation-engine/arsenal/generated/open-care-chunk-03";
import { ARSENAL_2026_OPEN_CARE_CHUNK_04 } from "@/features/simulation-engine/arsenal/generated/open-care-chunk-04";

export type Arsenal2026OpenCareTuple = readonly [
  sourceRow: number,
  reyimenCode: string | null,
  trakcareCode: string | null,
  description: string,
  pharmaceuticalForm: string,
  unit: string | null,
  exclusiveUse: string | null,
];

export const ARSENAL_2026_OPEN_CARE_ROWS: readonly Arsenal2026OpenCareTuple[] = [
  ...ARSENAL_2026_OPEN_CARE_CHUNK_01,
  ...ARSENAL_2026_OPEN_CARE_CHUNK_02,
  ...ARSENAL_2026_OPEN_CARE_CHUNK_03,
  ...ARSENAL_2026_OPEN_CARE_CHUNK_04,
];
