import { StockDetailChart } from "@/components/stock-detail/StockDetailChart";
import { getStockPriceHistory } from "@/lib/queries/stock-price-history";

type StockDetailChartServerProps = {
  symbol: string;
  range: string;
};

const RANGE_DAYS_MAP: Record<string, number> = {
  "1w": 7,
  "1m": 30,
  "6m": 180,
  "1y": 365,
};

const getRangeDays = (range: string): number => {
  return RANGE_DAYS_MAP[range] ?? 30;
};

export async function StockDetailChartServer({
  symbol,
  range,
}: StockDetailChartServerProps) {
  const days = getRangeDays(range);
  const rows = await getStockPriceHistory({ symbol, days });

  return (
    <StockDetailChart
      rows={rows}
      selectedRange={range}
      symbol={symbol}
    />
  );
}
