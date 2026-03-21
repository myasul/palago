import { sql } from "drizzle-orm";

import { db } from "@palago/db/client";

export type StockDetailRange52 = {
  low52: string | null;
  high52: string | null;
  asOfDate: string | null;
};

export type StockDetailState = {
  symbol: string;
  toast: "no-price-data" | null;
  isFound: true;
  hasPriceData: boolean;
};

export type StockDetailPriceSnapshot = {
  stockId: number;
  symbol: string;
  stockName: string;
  boardLot: number | null;
  isActive: boolean | null;
  companyId: number | null;
  companyName: string;
  sector: string | null;
  subsector: string | null;
  logoUrl: string | null;
  tradeDate: string | null;
  lastClose: string | null;
  prevClose: string | null;
  openPrice: string | null;
  highPrice: string | null;
  lowPrice: string | null;
  volume: number | null;
  value: string | null;
  percentChange: string | null;
  minimumInvestment: string | null;
};

export type StockDetailPageResult = {
  stock: StockDetailPriceSnapshot;
  range52: StockDetailRange52 | null;
  state: StockDetailState;
};

export type GetStockDetailInput = {
  symbol: string;
};

type StockDetailRow = StockDetailPriceSnapshot & {
  low52: string | null;
  high52: string | null;
  asOfDate: string | null;
};

const normalizeSymbol = (symbol: string): string => {
  return symbol.trim().toUpperCase();
};

const toPageResult = (
  row: StockDetailRow,
  normalizedSymbol: string
): StockDetailPageResult => {
  const hasPriceData = row.tradeDate !== null;
  const range52 =
    row.low52 === null && row.high52 === null && row.asOfDate === null
      ? null
      : {
          low52: row.low52,
          high52: row.high52,
          asOfDate: row.asOfDate,
        };

  return {
    stock: {
      stockId: row.stockId,
      symbol: row.symbol,
      stockName: row.stockName,
      boardLot: row.boardLot,
      isActive: row.isActive,
      companyId: row.companyId,
      companyName: row.companyName,
      sector: row.sector,
      subsector: row.subsector,
      logoUrl: row.logoUrl,
      tradeDate: row.tradeDate,
      lastClose: row.lastClose,
      prevClose: row.prevClose,
      openPrice: row.openPrice,
      highPrice: row.highPrice,
      lowPrice: row.lowPrice,
      volume: row.volume,
      value: row.value,
      percentChange: row.percentChange,
      minimumInvestment: row.minimumInvestment,
    },
    range52,
    state: {
      symbol: normalizedSymbol,
      toast: hasPriceData ? null : "no-price-data",
      isFound: true,
      hasPriceData,
    },
  };
};

export const getStockDetail = async ({
  symbol,
}: GetStockDetailInput): Promise<StockDetailPageResult | null> => {
  const normalizedSymbol = normalizeSymbol(symbol);

  const rows = await db.execute<StockDetailRow>(sql`
    SELECT
      stocks.id AS "stockId",
      stocks.symbol AS "symbol",
      stocks.name AS "stockName",
      stocks.board_lot AS "boardLot",
      stocks.is_active AS "isActive",
      stocks.company_id AS "companyId",
      companies.name AS "companyName",
      companies.sector AS "sector",
      companies.subsector AS "subsector",
      companies.logo_url AS "logoUrl",
      latest_prices.trade_date::text AS "tradeDate",
      latest_prices.close_price::text AS "lastClose",
      previous_prices.close_price::text AS "prevClose",
      latest_prices.open_price::text AS "openPrice",
      latest_prices.high_price::text AS "highPrice",
      latest_prices.low_price::text AS "lowPrice",
      latest_prices.volume AS "volume",
      latest_prices.value::text AS "value",
      latest_prices.percent_change::text AS "percentChange",
      CASE
        WHEN stocks.board_lot IS NULL OR latest_prices.close_price IS NULL THEN NULL
        ELSE (stocks.board_lot::numeric * latest_prices.close_price)::text
      END AS "minimumInvestment",
      stock_52_week.low_52w::text AS "low52",
      stock_52_week.high_52w::text AS "high52",
      stock_52_week.as_of_date::text AS "asOfDate"
    FROM stocks
    INNER JOIN companies
      ON stocks.company_id = companies.id
    LEFT JOIN LATERAL (
      SELECT
        daily_prices.trade_date,
        daily_prices.close_price,
        daily_prices.open_price,
        daily_prices.high_price,
        daily_prices.low_price,
        daily_prices.volume,
        daily_prices.value,
        daily_prices.percent_change
      FROM daily_prices
      WHERE daily_prices.stock_id = stocks.id
      ORDER BY daily_prices.trade_date DESC
      LIMIT 1
    ) AS latest_prices ON true
    LEFT JOIN LATERAL (
      SELECT
        daily_prices.close_price
      FROM daily_prices
      WHERE daily_prices.stock_id = stocks.id
      ORDER BY daily_prices.trade_date DESC
      OFFSET 1
      LIMIT 1
    ) AS previous_prices ON true
    LEFT JOIN stock_52_week
      ON stock_52_week.stock_id = stocks.id
    WHERE stocks.symbol = ${normalizedSymbol}
    LIMIT 1
  `);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return toPageResult(row, normalizedSymbol);
};
