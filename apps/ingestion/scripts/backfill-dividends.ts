import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { dividends, stocks } from "@palago/db/schema";
import { PSEEdgeProvider } from "@palago/pse-edge";

import { db } from "../shared/db";
import { logger } from "../shared/logger";
import { sleep } from "../shared/sleep";

const JOB_NAME = "backfill-dividends";
const STOCK_DELAY_MS = 1000;
const INSERT_BATCH_SIZE = 100;

const provider = new PSEEdgeProvider();

type CliOptions = {
  startAt: number | null;
};

type DividendWriteRow = {
  stockId: number;
  securityType: string;
  dividendType: string;
  amountPerShare: string | null;
  declarationDate: null;
  exDate: string | null;
  recordDate: string | null;
  paymentDate: string | null;
  fiscalYear: null;
};

const parseArgs = (argv: string[]): CliOptions => {
  let startAt: number | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--start-at") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("Missing value for --start-at");
      }

      startAt = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (argument.startsWith("--start-at=")) {
      startAt = Number.parseInt(argument.slice("--start-at=".length), 10);
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (startAt !== null && (!Number.isInteger(startAt) || startAt < 1)) {
    throw new Error("--start-at must be a positive integer");
  }

  return { startAt };
};

const toSqlDate = (value: Date | null): string | null => {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10);
};

const toNumericString = (value: number | null) => (value === null ? null : value.toString());

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const dedupeDividendRows = (rows: DividendWriteRow[]) => {
  const deduped = new Map<string, DividendWriteRow>();

  for (const row of rows) {
    const key =
      row.exDate !== null
        ? `${row.stockId}:${row.exDate}`
        : [
            row.stockId,
            row.securityType,
            row.dividendType,
            row.recordDate ?? "",
            row.paymentDate ?? "",
            row.amountPerShare ?? "",
          ].join(":");

    deduped.set(key, row);
  }

  return [...deduped.values()];
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const activeStocks = await db
    .select({
      id: stocks.id,
      symbol: stocks.symbol,
      edgeCmpyId: stocks.edgeCmpyId,
    })
    .from(stocks)
    .where(and(isNotNull(stocks.edgeCmpyId), eq(stocks.isActive, true)));

  const existingDividendStockIds = new Set(
    activeStocks.length === 0
      ? []
      : (
          await db
            .selectDistinct({ stockId: dividends.stockId })
            .from(dividends)
            .where(inArray(dividends.stockId, activeStocks.map((stock) => stock.id)))
        ).map((row) => row.stockId),
  );
  const firstMissingIndex = activeStocks.findIndex(
    (stock) => !existingDividendStockIds.has(stock.id),
  );
  const startIndex =
    options.startAt !== null
      ? options.startAt - 1
      : firstMissingIndex === -1
        ? activeStocks.length
        : firstMissingIndex;

  let stocksProcessed = 0;
  let stocksSkipped = 0;
  let dividendsWritten = 0;
  let stocksWithNoDividends = 0;
  let failures = 0;

  if (startIndex > activeStocks.length) {
    throw new Error(
      `--start-at ${options.startAt} is outside the stock list (total ${activeStocks.length})`,
    );
  }

  logger.info("Resolved backfill-dividends starting point", {
    job: JOB_NAME,
    mode: options.startAt === null ? "auto-resume" : "manual-start",
    startAt: startIndex + 1,
    totalStocks: activeStocks.length,
  });

  if (startIndex === activeStocks.length) {
    logger.info("All active stocks already appear to have dividend rows; nothing to do", {
      job: JOB_NAME,
      totalStocks: activeStocks.length,
    });
    return;
  }

  for (const [index, stock] of activeStocks.entries()) {
    if (index < startIndex) {
      continue;
    }

    if (!stock.edgeCmpyId) {
      logger.warn("Skipping stock without edgeCmpyId", {
        job: JOB_NAME,
        index: index + 1,
        symbol: stock.symbol,
      });
      continue;
    }

    // This resume check is only a pragmatic shortcut. Stocks with genuinely
    // zero dividend history will not have persisted rows, so auto-resume may
    // revisit them on later runs unless --start-at is used.
    if (options.startAt === null && existingDividendStockIds.has(stock.id)) {
      stocksSkipped += 1;
      logger.info(`[${index + 1}/${activeStocks.length}] ${stock.symbol} skipped`, {
        job: JOB_NAME,
        symbol: stock.symbol,
        stockId: stock.id,
        reason: "stock already has dividend rows",
      });
      continue;
    }

    try {
      const dividendRows = await provider.getDividends(stock.edgeCmpyId);
      stocksProcessed += 1;

      if (dividendRows.length === 0) {
        stocksWithNoDividends += 1;

        logger.info(`[${index + 1}/${activeStocks.length}] ${stock.symbol} wrote 0 dividend rows`, {
          job: JOB_NAME,
          symbol: stock.symbol,
          stockId: stock.id,
          rowsWritten: 0,
        });
      } else {
        const writeRows = dedupeDividendRows(
          dividendRows.map((dividendRow) => ({
            stockId: stock.id,
            securityType: dividendRow.securityType,
            dividendType: dividendRow.dividendType,
            amountPerShare: toNumericString(dividendRow.dividendRate),
            declarationDate: null,
            exDate: toSqlDate(dividendRow.exDate),
            recordDate: toSqlDate(dividendRow.recordDate),
            paymentDate: toSqlDate(dividendRow.paymentDate),
            fiscalYear: null,
          })),
        );

        for (const batch of chunk(writeRows, INSERT_BATCH_SIZE)) {
          await db
            .insert(dividends)
            .values(batch)
            .onConflictDoUpdate({
              target: [dividends.stockId, dividends.exDate],
              set: {
                securityType: sql`excluded.security_type`,
                dividendType: sql`excluded.dividend_type`,
                amountPerShare: sql`excluded.amount_per_share`,
                declarationDate: sql`excluded.declaration_date`,
                recordDate: sql`excluded.record_date`,
                paymentDate: sql`excluded.payment_date`,
                fiscalYear: sql`excluded.fiscal_year`,
              },
            });
        }

        dividendsWritten += writeRows.length;

        logger.info(
          `[${index + 1}/${activeStocks.length}] ${stock.symbol} wrote ${writeRows.length} dividend rows`,
          {
            job: JOB_NAME,
            symbol: stock.symbol,
            stockId: stock.id,
            rowsWritten: writeRows.length,
            sourceRows: dividendRows.length,
          },
        );
      }
    } catch (error) {
      failures += 1;
      logger.warn("Dividend backfill failed; continuing with next stock", {
        job: JOB_NAME,
        index: index + 1,
        symbol: stock.symbol,
        edgeCmpyId: stock.edgeCmpyId,
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

  logger.info(`Stocks processed: ${stocksProcessed}`, { job: JOB_NAME });
  logger.info(`Stocks skipped: ${stocksSkipped}`, { job: JOB_NAME });
  logger.info(`Dividends written: ${dividendsWritten}`, { job: JOB_NAME });
  logger.info(`Stocks with no dividends: ${stocksWithNoDividends}`, { job: JOB_NAME });
  logger.info(`Failures: ${failures}`, { job: JOB_NAME });
};

run().catch((error) => {
  logger.error("Dividend backfill failed", {
    job: JOB_NAME,
    error: error instanceof Error ? error.message : String(error),
    cause:
      error instanceof Error && "cause" in error
        ? String((error as { cause?: unknown }).cause)
        : undefined,
  });
  process.exitCode = 1;
});
