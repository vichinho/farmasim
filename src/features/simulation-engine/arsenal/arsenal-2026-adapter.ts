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

function supplementalConflictDescriptions(): Set<string> {
  const candidates = new Map<string, Set<string>>();

  for (const tuple of ARSENAL_2026_OPEN_CARE_ROWS) {
    const [, , , description, , , , , supplementalDescription] = tuple;
    if (parseArsenalDescription(description).strength || !supplementalDescription) continue;
    if (!parseArsenalDescription(supplementalDescription).strength) continue;

    const normalizedSupplemental = normalizeWhitespace(supplementalDescription).toLocaleUpperCase("es-CL");
    const descriptions = candidates.get(normalizedSupplemental) ?? new Set<string>();
    descriptions.add(normalizeWhitespace(description).toLocaleUpperCase("es-CL"));
    candidates.set(normalizedSupplemental, descriptions);
  }

  return new Set(
    [...candidates.entries()]
      .filter(([, rawDescriptions]) => rawDescriptions.size > 1)
      .map(([supplementalDescription]) => supplementalDescription),
  );
}

const CONFLICTING_SUPPLEMENTAL_DESCRIPTIONS = supplementalConflictDescriptions();

function tupleToPresentation(tuple: (typeof ARSENAL_2026_OPEN_CARE_ROWS)[number]): MedicationPresentation {
  const [
    sourceRow,
    reyimenCode,
    trakcareCode,
    description,
    pharmaceuticalForm,
    unit,
    exclusiveUse,
    sourceGroup,
    supplementalDescription,
  ] = tuple;
  const parsedPrimary = parseArsenalDescription(description);
  const parsedSupplemental = supplementalDescription
    ? parseArsenalDescription(supplementalDescription)
    : undefined;
  const normalizedSupplemental = supplementalDescription
    ? normalizeWhitespace(supplementalDescription).toLocaleUpperCase("es-CL")
    : undefined;
  const supplementalConflict = normalizedSupplemental
    ? CONFLICTING_SUPPLEMENTAL_DESCRIPTIONS.has(normalizedSupplemental)
    : false;

  let strength = parsedPrimary.strength;
  let strengthSource: "primary" | "supplemental" | "none" = strength ? "primary" : "none";
  let reviewStatus: "parsed" | "supplemental-parsed" | "requires-review" = strength
    ? "parsed"
    : "requires-review";
  let reviewReason: "no-strength-in-source" | "conflicting-supplemental-description" | undefined;

  if (!strength && parsedSupplemental?.strength && !supplementalConflict) {
    strength = parsedSupplemental.strength;
    strengthSource = "supplemental";
    reviewStatus = "supplemental-parsed";
  } else if (!strength) {
    reviewReason = supplementalConflict
      ? "conflicting-supplemental-description"
      : "no-strength-in-source";
  }

  const sourceIdentity = trakcareCode ?? `row-${sourceRow}`;

  return {
    id: `arsenal-2026-${slug(sourceIdentity)}`,
    medicationId: `med-${slug(parsedPrimary.genericName)}`,
    genericName: parsedPrimary.genericName,
    strength,
    pharmaceuticalForm: normalizeWhitespace(pharmaceuticalForm),
    source: {
      catalog: "arsenal-2026",
      sourceRow,
      trakcareCode: trakcareCode ?? undefined,
      reyimenCode: reyimenCode ?? undefined,
      rawDescription: description,
      supplementalDescription: supplementalDescription ?? undefined,
      sourceGroup: sourceGroup ?? undefined,
      unit: unit ?? undefined,
      exclusiveUse: exclusiveUse ?? undefined,
      strengthSource,
      reviewStatus,
      reviewReason,
    },
  };
}

export const arsenal2026OpenCarePresentations: readonly MedicationPresentation[] =
  ARSENAL_2026_OPEN_CARE_ROWS.map(tupleToPresentation);

export type Arsenal2026ReviewItem = {
  sourceRow: number;
  trakcareCode?: string;
  rawDescription: string;
  supplementalDescription?: string;
  reason: "no-strength-in-source" | "conflicting-supplemental-description";
};

export type Arsenal2026AdapterReport = {
  sourceRows: number;
  presentations: number;
  primaryStrengthParsed: number;
  supplementalStrengthParsed: number;
  withParsedStrength: number;
  requiresReview: number;
  noStrengthInSource: number;
  sourceConflicts: number;
  alternateStrengthGroups: number;
  reviewItems: Arsenal2026ReviewItem[];
};

export function buildArsenal2026AdapterReport(): Arsenal2026AdapterReport {
  const primaryStrengthParsed = arsenal2026OpenCarePresentations.filter(
    (item) => item.source?.strengthSource === "primary",
  ).length;
  const supplementalStrengthParsed = arsenal2026OpenCarePresentations.filter(
    (item) => item.source?.strengthSource === "supplemental",
  ).length;
  const reviewItems = arsenal2026OpenCarePresentations
    .filter((item) => item.source?.reviewStatus === "requires-review")
    .map((item) => ({
      sourceRow: item.source?.sourceRow ?? -1,
      trakcareCode: item.source?.trakcareCode,
      rawDescription: item.source?.rawDescription ?? item.genericName,
      supplementalDescription: item.source?.supplementalDescription,
      reason: item.source?.reviewReason ?? "no-strength-in-source",
    }));
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
    primaryStrengthParsed,
    supplementalStrengthParsed,
    withParsedStrength: primaryStrengthParsed + supplementalStrengthParsed,
    requiresReview: reviewItems.length,
    noStrengthInSource: reviewItems.filter((item) => item.reason === "no-strength-in-source").length,
    sourceConflicts: reviewItems.filter(
      (item) => item.reason === "conflicting-supplemental-description",
    ).length,
    alternateStrengthGroups: [...groups.values()].filter((strengths) => strengths.size >= 2).length,
    reviewItems,
  };
}
