import { HistoricalPricePointListSchema } from "../schemas";

type DisclosureChartResponse = {
  chartData?: Array<{
    OPEN?: unknown;
    HIGH?: unknown;
    LOW?: unknown;
    CLOSE?: unknown;
    VALUE?: unknown;
    CHART_DATE?: unknown;
  }>;
};

export const parseHistoricalPrices = (
  payload: DisclosureChartResponse | string,
  edgeCmpyId: string,
  edgeSecId: string,
) => {
  const parsedPayload = typeof payload === "string" ? (JSON.parse(payload) as DisclosureChartResponse) : payload;
  const rows = parsedPayload.chartData ?? [];

  return HistoricalPricePointListSchema.parse(
    rows.map((row) => ({
      edgeCmpyId,
      edgeSecId,
      tradeDate: row.CHART_DATE,
      openPrice: row.OPEN ?? null,
      highPrice: row.HIGH ?? null,
      lowPrice: row.LOW ?? null,
      closePrice: row.CLOSE ?? null,
      value: row.VALUE ?? null,
      volume: null,
    })),
  );
};
