const getFractionDigits = (value: number) => {
  if (value !== 0 && Math.abs(value) < 1) {
    return 4;
  }

  return 2;
};

const formatCurrency = (value: number, fractionDigits: number) => {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
};

export const formatStockPrice = (value: string | null): string => {
  if (value === null) {
    return "—";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return formatCurrency(parsed, getFractionDigits(parsed));
};

export const formatCurrencyAmount = (value: string | null): string => {
  if (value === null) {
    return "—";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return formatCurrency(parsed, 2);
};
