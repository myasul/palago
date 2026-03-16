import { and, eq, isNotNull, sql } from "drizzle-orm";

import { dailyPrices, stocks } from "@palago/db/schema";
import { PSEEdgeProvider } from "@palago/pse-edge";

import { db } from "../shared/db";
import { logger } from "../shared/logger";
import { sleep } from "../shared/sleep";

const JOB_NAME = "backfill-prices";
const STOCK_DELAY_MS = 1000;

type CliOptions = {
  symbol: string | null;
  from: string | null;
  to: string | null;
};

const provider = new PSEEdgeProvider();

const parseArgs = (argv: string[]): CliOptions => {
  let symbol: string | null = null;
  let from: string | null = null;
  let to: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];

    if (argument === "--symbol") {
      if (!value) {
        throw new Error("Missing value for --symbol");
      }

      symbol = value.trim().toUpperCase();
      index += 1;
      continue;
    }

    if (argument.startsWith("--symbol=")) {
      symbol = argument.slice("--symbol=".length).trim().toUpperCase();
      continue;
    }

    if (argument === "--from") {
      if (!value) {
        throw new Error("Missing value for --from");
      }

      from = value.trim();
      index += 1;
      continue;
    }

    if (argument.startsWith("--from=")) {
      from = argument.slice("--from=".length).trim();
      continue;
    }

    if (argument === "--to") {
      if (!value) {
        throw new Error("Missing value for --to");
      }

      to = value.trim();
      index += 1;
      continue;
    }

    if (argument.startsWith("--to=")) {
      to = argument.slice("--to=".length).trim();
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (symbol !== null && symbol.length === 0) {
    throw new Error("--symbol must not be empty");
  }

  return { symbol, from, to };
};

const padNumber = (value: number) => value.toString().padStart(2, "0");

const toSqlDate = (value: Date): string =>
  `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(value.getDate())}`;

const parseSqlDate = (value: string): Date => {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!matched) {
    throw new Error(`Invalid date: ${value}. Expected YYYY-MM-DD`);
  }

  const [, yearText, monthText, dayText] = matched;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return date;
};

const shiftDate = (value: Date, deltaDays: number): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + deltaDays);
  return next;
};

const getDefaultRange = () => {
  const today = new Date();
  const toDate = shiftDate(today, -1);
  const fromDate = new Date(toDate);
  fromDate.setFullYear(fromDate.getFullYear() - 2);

  return {
    from: toSqlDate(fromDate),
    to: toSqlDate(toDate),
  };
};

const toProviderDate = (value: string) => {
  const date = parseSqlDate(value);
  return `${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}-${date.getFullYear()}`;
};

const toNumericString = (value: number | null) => (value === null ? null : value.toString());

const run = async () => {
  const startedAt = Date.now();
  const options = parseArgs(process.argv.slice(2));
  const defaultRange = getDefaultRange();
  const from = options.from ?? defaultRange.from;
  const to = options.to ?? defaultRange.to;
  const fromDate = parseSqlDate(from);
  const toDate = parseSqlDate(to);

  if (fromDate.getTime() > toDate.getTime()) {
    throw new Error(`--from ${from} must be on or before --to ${to}`);
  }

  const filters = [
    isNotNull(stocks.edgeCmpyId),
    isNotNull(stocks.edgeSecId),
    eq(stocks.isActive, true),
  ];

  if (options.symbol !== null) {
    filters.push(eq(stocks.symbol, options.symbol));
  }

  const activeStocks = await db
    .select({
      id: stocks.id,
      symbol: stocks.symbol,
      edgeCmpyId: stocks.edgeCmpyId,
      edgeSecId: stocks.edgeSecId,
    })
    .from(stocks)
    .where(and(...filters));

  logger.info(`Range : ${from} -> ${to}`, { job: JOB_NAME, from, to });
  logger.info(`Stocks: ${activeStocks.length}`, {
    job: JOB_NAME,
    count: activeStocks.length,
    symbol: options.symbol,
  });

  let stocksProcessed = 0;
  let rowsWritten = 0;
  let failures = 0;

  const providerFrom = toProviderDate(from);
  const providerTo = toProviderDate(to);

  for (const [index, stock] of activeStocks.entries()) {
    if (!stock.edgeCmpyId || !stock.edgeSecId) {
      logger.warn("Skipping stock without required provider identifiers", {
        job: JOB_NAME,
        index: index + 1,
        symbol: stock.symbol,
        edgeCmpyId: stock.edgeCmpyId,
        edgeSecId: stock.edgeSecId,
      });
      continue;
    }

    try {
      const pricePoints = await provider.getHistoricalPrices(
        stock.edgeCmpyId,
        stock.edgeSecId,
        providerFrom,
        providerTo,
      );

      for (const pricePoint of pricePoints) {
        await db
          .insert(dailyPrices)
          .values({
            stockId: stock.id,
            tradeDate: toSqlDate(pricePoint.tradeDate),
            openPrice: toNumericString(pricePoint.openPrice),
            highPrice: toNumericString(pricePoint.highPrice),
            lowPrice: toNumericString(pricePoint.lowPrice),
            closePrice: toNumericString(pricePoint.closePrice),
            value: toNumericString(pricePoint.value),
            volume: null,
          })
          .onConflictDoUpdate({
            target: [dailyPrices.stockId, dailyPrices.tradeDate],
            set: {
              openPrice: toNumericString(pricePoint.openPrice),
              highPrice: toNumericString(pricePoint.highPrice),
              lowPrice: toNumericString(pricePoint.lowPrice),
              closePrice: toNumericString(pricePoint.closePrice),
              value: toNumericString(pricePoint.value),
              volume: null,
            },
          });
      }

      stocksProcessed += 1;
      rowsWritten += pricePoints.length;

      logger.info(`[${index + 1}/${activeStocks.length}] ${stock.symbol} wrote ${pricePoints.length} rows`, {
        job: JOB_NAME,
        symbol: stock.symbol,
        stockId: stock.id,
        rowsWritten: pricePoints.length,
      });
    } catch (error) {
      failures += 1;
      logger.warn("Price backfill failed; continuing with next stock", {
        job: JOB_NAME,
        index: index + 1,
        symbol: stock.symbol,
        edgeCmpyId: stock.edgeCmpyId,
        edgeSecId: stock.edgeSecId,
        error: error instanceof Error ? error.message : String(error),
        cause:
          error instanceof Error && "cause" in error
            ? String((error as { cause?: unknown }).cause)
            : undefined,
      });
    }

    if (index < activeStocks.length - 1) {
      await sleep(STOCK_DELAY_MS);
    }
  }

  await db.execute(sql`
    UPDATE daily_prices AS dp
    SET percent_change = ROUND(
      ((dp.close_price - prev.prev_close) / prev.prev_close * 100)::numeric,
      4
    )
    FROM (
      SELECT
        id,
        LAG(close_price) OVER (
          PARTITION BY stock_id ORDER BY trade_date ASC
        ) AS prev_close
      FROM daily_prices
    ) AS prev
    WHERE dp.id = prev.id
      AND prev.prev_close IS NOT NULL
      AND dp.trade_date BETWEEN CAST(${from} AS date) AND CAST(${to} AS date)
  `);

  await db.execute(sql.raw("REFRESH MATERIALIZED VIEW CONCURRENTLY stock_52_week"));

  const durationMs = Date.now() - startedAt;

  logger.info(`Stocks processed: ${stocksProcessed}`, { job: JOB_NAME });
  logger.info(`Rows written: ${rowsWritten}`, { job: JOB_NAME });
  logger.info(`Failures: ${failures}`, { job: JOB_NAME });
  logger.info(`Duration: ${durationMs}ms`, { job: JOB_NAME, durationMs });
};

run().catch((error) => {
  logger.error("Price backfill failed", {
    job: JOB_NAME,
    error: error instanceof Error ? error.message : String(error),
    cause:
      error instanceof Error && "cause" in error
        ? String((error as { cause?: unknown }).cause)
        : undefined,
  });
  process.exitCode = 1;
});
