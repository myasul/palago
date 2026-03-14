const NUMBER_CLEANUP_PATTERN = /,/g;
const PERCENT_PATTERN = /%/g;

const normalizeNumericText = (value: string): string => value.replace(NUMBER_CLEANUP_PATTERN, "").trim();

export const toNullableNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || /^n\/a$/i.test(trimmed)) {
    return null;
  }

  const normalized = normalizeNumericText(trimmed).replace(PERCENT_PATTERN, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
};

export const toNullablePercent = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || /^no limit$/i.test(trimmed)) {
    return null;
  }

  const matched = trimmed.match(/(-?\d[\d,]*(?:\.\d+)?)\s*%/);

  if (matched) {
    return toNullableNumber(matched[1]);
  }

  return toNullableNumber(trimmed);
};

export const toNullablePercentChange = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return toNullablePercent(value);
  }

  const matched = value.match(/\(\s*([0-9][\d,]*(?:\.\d+)?)%\s*\)/);

  if (!matched) {
    return toNullablePercent(value);
  }

  const parsed = toNullableNumber(matched[1]);

  if (parsed === null) {
    return null;
  }

  return /\bdown\b/i.test(value) ? -parsed : parsed;
};
