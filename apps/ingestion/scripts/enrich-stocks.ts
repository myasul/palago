import { and, eq, isNotNull } from "drizzle-orm";

import { stocks } from "@palago/db/schema";
import { PSEEdgeProvider } from "@palago/pse-edge";

import { db } from "../shared/db";
import { logger } from "../shared/logger";
import { sleep } from "../shared/sleep";

const JOB_NAME = "enrich-stocks";
const STOCK_DELAY_MS = 1000;

const provider = new PSEEdgeProvider();

const toSqlDate = (value: Date | null): string | null => {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(0, 10);
};

const run = async () => {
  const activeStocks = await db
    .select({
      symbol: stocks.symbol,
      edgeCmpyId: stocks.edgeCmpyId,
      isActive: stocks.isActive,
    })
    .from(stocks)
    .where(and(isNotNull(stocks.edgeCmpyId), eq(stocks.isActive, true)));

  let stocksEnriched = 0;
  let failures = 0;

  for (const [index, stock] of activeStocks.entries()) {
    if (!stock.edgeCmpyId) {
      logger.warn("Skipping stock without edgeCmpyId", {
        job: JOB_NAME,
        index: index + 1,
        symbol: stock.symbol,
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
