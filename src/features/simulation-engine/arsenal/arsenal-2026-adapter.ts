import { ARSENAL_2026_OPEN_CARE_ROWS } from "@/features/simulation-engine/arsenal/arsenal-2026-open-care.generated";
import type { MedicationPresentation } from "@/features/simulation-engine/types";

const TRAILING_FORM_TOKENS = [
  "COMPRIMIDO ORAL",
  "CAPSULA ORAL",
  "COMPRIMIDO",
  "CAPSULA",
  "AMPOLLA",
  "FRASCO",
  "JERINGA",
  "JERINGA PRELLENADA",
  "PARCHE",
  "SUPOSITORIO",
  "OVULO",
  "JARABE",
  "SUSPENSION",
  "SOLUCION",
  "CREMA",
  "GEL",
  "SPRAY",
  "AEROSOL",
  "INHALADOR",
  "UNG OFT",
  "SOL OFT",
  "CM",
  "CP",
  "CAP",
  "FA",
  "AM",
  "FC",
  "FCO",
  "JBE",
  "GTS",
  "INH",
  "SUP",
  "OV",
] as const;

const STRENGTH_PATTERN = /(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?){0,3})\s*(MCG|UG|MG|MEQ|MMOL|UI|GR|G|U|%)(?:\s*\/\s*(\d+(?:[.,]\d+)?)?\s*(GOTAS|GOTA|DOSIS|ML|L|HR))?/i;

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slug(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function displayName(value: string): string {
  return value
    .toLocaleLowerCase("es-CL")
    .replace(/(^|[\s/+(])-?\p{L}/gu, (match) => match.toLocaleUpperCase("es-CL"));
}

function stripTrailingFormTokens(value: string): string {
  let next = normalizeWhitespace(value);
  let changed = true;

  while (changed) {
    changed = false;
    const upper = next.toLocaleUpperCase("es-CL");

    for (const token of TRAILING_FORM_TOKENS) {
      if (upper === token) {
        next = "";
        changed = true;
        break;
      }
      if (upper.endsWith(` ${token}`)) {
        next = normalizeWhitespace(next.slice(0, next.length - token.length));
        changed = true;
        break;
      }
    }
  }

  return next;
}

export type ParsedArsenalDescription = {
  genericName: string;
  strength?: string;
};

export function parseArsenalDescription(description: string): ParsedArsenalDescription {
  const normalized = normalizeWhitespace(description).toLocaleUpperCase("es-CL");
  const match = STRENGTH_PATTERN.exec(normalized);

  if (!match || match.index === undefined) {
    const fallbackName = stripTrailingFormTokens(normalized);
    return { genericName: displayName(fallbackName || normalized) };
  }

  const genericNameRaw = stripTrailingFormTokens(normalized.slice(0, match.index).replace(/[\s\-/]+$/g, ""));
  const numerator = match[1]?.replace(/,/g, ".").replace(/\s+/g, "") ?? "";
  const unit = match[2]?.toLocaleUpperCase("es-CL") ?? "";
  const denominatorValue = match[3]?.replace(/,/g, ".");
  const denominatorUnit = match[4]?.toLocaleUpperCase("es-CL");
  const denominator = denominatorUnit
    ? `/${denominatorValue ? `${denominatorValue} ` : ""}${denominatorUnit}`
    : "";

  return {
    genericName: displayName(genericNameRaw || normalized),
    strength: `${numerator} ${unit}${denominator}`.trim(),
  };
}

function tupleToPresentation(tuple: (typeof ARSENAL_2026_OPEN_CARE_ROWS)[number]): MedicationPresentation {
  const [sourceRow, reyimenCode, trakcareCode, description, pharmaceuticalForm, unit, exclusiveUse] = tuple;
  const parsed = parseArsenalDescription(description);
  const sourceIdentity = trakcareCode ?? `row-${sourceRow}`;

  return {
    id: `arsenal-2026-${slug(sourceIdentity)}`,
    medicationId: `med-${slug(parsed.genericName)}`,
    genericName: parsed.genericName,
    strength: parsed.strength,
    pharmaceuticalForm: normalizeWhitespace(pharmaceuticalForm),
    source: {
      catalog: "arsenal-2026",
      sourceRow,
      trakcareCode: trakcareCode ?? undefined,
      reyimenCode: reyimenCode ?? undefined,
      rawDescription: description,
      unit: unit ?? undefined,
      exclusiveUse: exclusiveUse ?? undefined,
    },
  };
}

export const arsenal2026OpenCarePresentations: readonly MedicationPresentation[] =
  ARSENAL_2026_OPEN_CARE_ROWS.map(tupleToPresentation);

export type Arsenal2026AdapterReport = {
  sourceRows: number;
  presentations: number;
  withParsedStrength: number;
  withoutParsedStrength: number;
  alternateStrengthGroups: number;
};

export function buildArsenal2026AdapterReport(): Arsenal2026AdapterReport {
  const withParsedStrength = arsenal2026OpenCarePresentations.filter((item) => item.strength).length;
  const groups = new Map<string, Set<string>>();

  for (const presentation of arsenal2026OpenCarePresentations) {
    if (!presentation.strength) continue;
    const key = `${presentation.medicationId}|${presentation.pharmaceuticalForm.toLocaleUpperCase("es-CL")}`;
    const strengths = groups.get(key) ?? new Set<string>();
    strengths.add(presentation.strength);
    groups.set(key, strengths);
  }

  return {
    sourceRows: ARSENAL_2026_OPEN_CARE_ROWS.length,
    presentations: arsenal2026OpenCarePresentations.length,
    withParsedStrength,
    withoutParsedStrength: arsenal2026OpenCarePresentations.length - withParsedStrength,
    alternateStrengthGroups: [...groups.values()].filter((strengths) => strengths.size >= 2).length,
  };
}
