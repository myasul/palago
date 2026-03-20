import { and, eq, isNotNull } from "drizzle-orm";

import { stocks } from "@palago/db/schema";
import { PSEEdgeProvider } from "@palago/pse-edge";

import { db } from "../shared/db";
import { logger } from "../shared/logger";
import { sleep } from "../shared/sleep";

const JOB_NAME = "enrich-stocks";
const STOCK_DELAY_MS = 1000;

const provider = new PSEEdgeProvider();

type CliOptions = {
  startAt: number | null;
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

const isAlreadyEnriched = (stock: {
  createdAt: Date | null;
  updatedAt: Date | null;
}) =>
  stock.createdAt !== null &&
  stock.updatedAt !== null &&
  stock.updatedAt.getTime() > stock.createdAt.getTime();

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const activeStocks = await db
    .select({
      symbol: stocks.symbol,
      edgeCmpyId: stocks.edgeCmpyId,
      isActive: stocks.isActive,
      createdAt: stocks.createdAt,
      updatedAt: stocks.updatedAt,
    })
    .from(stocks)
    .where(and(isNotNull(stocks.edgeCmpyId), eq(stocks.isActive, true)));

  // This resume check is only safe while enrich-stocks is the only workflow
  // that updates stock rows after seed-companies inserts them.
  const firstMissingIndex = activeStocks.findIndex((stock) => !isAlreadyEnriched(stock));
  const startIndex =
    options.startAt !== null
      ? options.startAt - 1
      : firstMissingIndex === -1
        ? activeStocks.length
        : firstMissingIndex;

  let stocksEnriched = 0;
  let stocksSkipped = 0;
  let failures = 0;

  if (startIndex > activeStocks.length) {
    throw new Error(
      `--start-at ${options.startAt} is outside the stock list (total ${activeStocks.length})`,
    );
  }

  logger.info("Resolved enrich-stocks starting point", {
    job: JOB_NAME,
    mode: options.startAt === null ? "auto-resume" : "manual-start",
    startAt: startIndex + 1,
    totalStocks: activeStocks.length,
  });

  if (startIndex === activeStocks.length) {
    logger.info("All active stocks already appear enriched; nothing to do", {
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

    if (options.startAt === null && isAlreadyEnriched(stock)) {
      stocksSkipped += 1;
      logger.info(`[${index + 1}/${activeStocks.length}] ${stock.symbol} skipped`, {
        job: JOB_NAME,
        symbol: stock.symbol,
        edgeCmpyId: stock.edgeCmpyId,
        reason: "stock already enriched",
      });
      continue;
    }

    try {
      const stockData = await provider.getStockData(stock.edgeCmpyId);

      await db
        .insert(stocks)
        .values({
          symbol: stock.symbol,
          name: stockData.securitySymbol,
          edgeCmpyId: stock.edgeCmpyId,
          edgeSecId: stockData.edgeSecId,
          boardLot: stockData.boardLot,
          isin: stockData.isin,
          issueType: stockData.issueType,
          outstandingShares: stockData.outstandingShares,
          listedShares: stockData.listedShares,
          issuedShares: stockData.issuedShares,
          freeFloatLevel: stockData.freeFloatLevel?.toString() ?? null,
          parValue: stockData.parValue?.toString() ?? null,
          foreignOwnershipLimit: stockData.foreignOwnershipLimit?.toString() ?? null,
          listingDate: toSqlDate(stockData.listingDate),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stocks.symbol,
          set: {
            edgeSecId: stockData.edgeSecId,
            boardLot: stockData.boardLot,
            isin: stockData.isin,
            issueType: stockData.issueType,
            outstandingShares: stockData.outstandingShares,
            listedShares: stockData.listedShares,
            issuedShares: stockData.issuedShares,
            freeFloatLevel: stockData.freeFloatLevel?.toString() ?? null,
            parValue: stockData.parValue?.toString() ?? null,
            foreignOwnershipLimit: stockData.foreignOwnershipLimit?.toString() ?? null,
            listingDate: toSqlDate(stockData.listingDate),
            updatedAt: new Date(),
          },
        });

      stocksEnriched += 1;

      logger.info(`[${index + 1}/${activeStocks.length}] ${stock.symbol} stock enriched`, {
        job: JOB_NAME,
        symbol: stock.symbol,
        edgeCmpyId: stock.edgeCmpyId,
        edgeSecId: stockData.edgeSecId,
      });
    } catch (error) {
      failures += 1;
      logger.warn("Stock enrichment failed; continuing with next stock", {
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

  logger.info(`Stocks enriched: ${stocksEnriched}`, { job: JOB_NAME });
  logger.info(`Stocks skipped: ${stocksSkipped}`, { job: JOB_NAME });
  logger.info(`Failures: ${failures}`, { job: JOB_NAME });
};

run().catch((error) => {
  logger.error("Stock enrichment backfill failed", {
    job: JOB_NAME,
    error: error instanceof Error ? error.message : String(error),
    cause:
      error instanceof Error && "cause" in error
        ? String((error as { cause?: unknown }).cause)
        : undefined,
  });
  process.exitCode = 1;
});
