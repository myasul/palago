const FALLBACK_52_WEEK_LABEL = "52-week range not yet available — not enough trading history.";

const formatPeso = (value: number): string => {
  const fractionDigits = value !== 0 && Math.abs(value) < 1 ? 4 : 2;

  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
};

const toNumber = (value: string | null): number | null => {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

export const getRangeBarPosition = (
  value: string | null,
  low: string | null,
  high: string | null
): number | null => {
  const parsedValue = toNumber(value);
  const parsedLow = toNumber(low);
  const parsedHigh = toNumber(high);

  if (parsedValue === null || parsedLow === null || parsedHigh === null) {
    return null;
  }

  if (parsedLow === parsedHigh) {
    return 50;
  }

  const percentage = ((parsedValue - parsedLow) / (parsedHigh - parsedLow)) * 100;

  return Math.min(100, Math.max(0, percentage));
};

export const getIntradaySecondaryText = (
  lastClose: string | null,
  low: string | null,
  high: string | null
): string | null => {
  const parsedLastClose = toNumber(lastClose);
  const parsedLow = toNumber(low);
  const parsedHigh = toNumber(high);

  if (parsedLastClose === null || parsedLow === null || parsedHigh === null) {
    return null;
  }

  if (parsedLastClose === parsedLow) {
    return `At today's low · ${formatPeso(parsedHigh - parsedLastClose)} below today's high`;
  }

  if (parsedLastClose === parsedHigh) {
    return `At today's high · ${formatPeso(parsedLastClose - parsedLow)} above today's low`;
  }

  return `${formatPeso(parsedLastClose - parsedLow)} above today's low · ${formatPeso(parsedHigh - parsedLastClose)} below today's high`;
};

export const getCloseVsOpenSubtitle = (
  lastClose: string | null,
  open: string | null
): { text: string; tone: "positive" | "negative" | "neutral" } | null => {
  const parsedLastClose = toNumber(lastClose);
  const parsedOpen = toNumber(open);

  if (parsedLastClose === null || parsedOpen === null) {
    return null;
  }

  if (parsedLastClose > parsedOpen) {
    return { text: "Closed up from open", tone: "positive" };
  }

  if (parsedLastClose < parsedOpen) {
    return { text: "Closed down from open", tone: "negative" };
  }

  return { text: "Unchanged from open", tone: "neutral" };
};

export const getPriceChange = (
  lastClose: string | null,
  prevClose: string | null
): { formatted: string; tone: "positive" | "negative" | "neutral" } | null => {
  const parsedLastClose = toNumber(lastClose);
  const parsedPrevClose = toNumber(prevClose);

  if (parsedLastClose === null || parsedPrevClose === null) {
    return null;
  }

  const diff = parsedLastClose - parsedPrevClose;

  if (diff > 0) {
    return {
      formatted: `+${Math.abs(diff).toFixed(2)}`,
      tone: "positive",
    };
  }

  if (diff < 0) {
    return {
      formatted: `−${Math.abs(diff).toFixed(2)}`,
      tone: "negative",
    };
  }

  return {
    formatted: "0.00",
    tone: "neutral",
  };
};

export const get52WeekLabel = (
  lastClose: string | null,
  low52: string | null,
  high52: string | null
): string => {
  const position = getRangeBarPosition(lastClose, low52, high52);
  const parsedLastClose = toNumber(lastClose);
  const parsedLow52 = toNumber(low52);
  const parsedHigh52 = toNumber(high52);

  if (
    position === null
    || parsedLastClose === null
    || parsedLow52 === null
    || parsedHigh52 === null
  ) {
    return FALLBACK_52_WEEK_LABEL;
  }

  if (position <= 33) {
    return `Near the 52-week low · ${formatPeso(parsedLastClose - parsedLow52)} above ${formatPeso(parsedLow52)}`;
  }

  if (position <= 66) {
    return `Mid-range · ${formatPeso(parsedLastClose - parsedLow52)} above ${formatPeso(parsedLow52)}`;
  }

  return `Near the 52-week high · ${formatPeso(parsedHigh52 - parsedLastClose)} below ${formatPeso(parsedHigh52)}`;
};
