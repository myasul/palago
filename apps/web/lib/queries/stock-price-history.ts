import { sql } from "drizzle-orm";

import { db } from "@palago/db/client";

export type StockPriceHistoryRow = {
  tradeDate: string;
  closePrice: string | null;
};

export type GetStockPriceHistoryInput = {
  symbol: string;
  days: number;
};

const normalizeSymbol = (symbol: string): string => {
  return symbol.trim().toUpperCase();
};

export const getStockPriceHistory = async ({
  symbol,
  days,
}: GetStockPriceHistoryInput): Promise<StockPriceHistoryRow[]> => {
  const normalizedSymbol = normalizeSymbol(symbol);

  const rows = await db.execute<StockPriceHistoryRow>(sql`
    WITH resolved_stock AS (
      SELECT stocks.id
      FROM stocks
      WHERE stocks.symbol = ${normalizedSymbol}
      LIMIT 1
    )
    SELECT
      daily_prices.trade_date::text AS "tradeDate",
      daily_prices.close_price::text AS "closePrice"
    FROM resolved_stock
    INNER JOIN daily_prices
      ON daily_prices.stock_id = resolved_stock.id
    WHERE daily_prices.trade_date >= CURRENT_DATE - (${days} * INTERVAL '1 day')
    ORDER BY daily_prices.trade_date ASC
  `);

  return rows;
};
