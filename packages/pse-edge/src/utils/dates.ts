const MONTHS = new Map<string, number>([
  ["Jan", 0],
  ["Feb", 1],
  ["Mar", 2],
  ["Apr", 3],
  ["May", 4],
  ["Jun", 5],
  ["Jul", 6],
  ["Aug", 7],
  ["Sep", 8],
  ["Oct", 9],
  ["Nov", 10],
  ["Dec", 11],
]);

const parseMonthDate = (value: string): Date | null => {
  const matched = value.trim().match(/^([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);

  if (!matched) {
    return null;
  }

  const [, monthName, dayText, yearText, hourText = "00", minuteText = "00", secondText = "00"] = matched;
  const month = MONTHS.get(monthName);

  if (month === undefined) {
    return null;
  }

  const date = new Date(
    Date.UTC(
      Number(yearText),
      month,
      Number(dayText),
      Number(hourText),
      Number(minuteText),
      Number(secondText),
    ),
  );

  return Number.isNaN(date.getTime()) ? null : date;
};

export const toNullableDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return parseMonthDate(trimmed);
};

export const toRequiredChartDate = (value: unknown): Date => {
  const parsed = toNullableDate(value);

  if (!parsed) {
    throw new Error(`Invalid chart date: ${String(value)}`);
  }

  return parsed;
};
