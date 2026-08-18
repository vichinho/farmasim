// Generated from ARSENAL 2026.xlsx, sheet "ARSENAL HT 2025".
// Scope: rows explicitly marked "X" in ATENCIÓN ABIERTA.
// Do not edit medication rows manually; regenerate from the source workbook when the arsenal changes.

export type Arsenal2026OpenCareRow = {
  sourceRow: number;
  reyimenCode: string | null;
  trakcareCode: string | null;
  description: string;
  pharmaceuticalForm: string;
  unit: string | null;
  exclusiveUse: string | null;
};

export const ARSENAL_2026_OPEN_CARE_ROWS: readonly Arsenal2026OpenCareRow[] = [
  {
    "sourceRow": 8,
    "reyimenCode": "42",
    "trakcareCode": "004-0001",
    "description": "ACENOCUMAROL CM 4MG",
    "pharmaceuticalForm": "COMPRIMIDO ORAL",
    "unit": "CM",
    "exclusiveUse": "POLI TACO"
  }
] as const;
