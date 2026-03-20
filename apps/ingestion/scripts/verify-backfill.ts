import { and, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { companies, dailyPrices, dividends, stocks } from "@palago/db/schema";

import { db } from "../shared/db";
import { logger } from "../shared/logger";

const JOB_NAME = "verify-backfill";
const SAMPLE_SYMBOL = "JFC";

const run = async () => {
  const [companiesCountResult, activeStocksCountResult, dailyPricesCountResult, dividendsCountResult] =
    await Promise.all([
      db.select({ count: count() }).from(companies),
      db
        .select({ count: count() })
        .from(stocks)
        .where(eq(stocks.isActive, true)),
      db.select({ count: count() }).from(dailyPrices),
      db.select({ count: count() }).from(dividends),
    ]);

  const companiesCount = companiesCountResult[0]?.count ?? 0;
  const activeStocksCount = activeStocksCountResult[0]?.count ?? 0;
  const dailyPricesCount = dailyPricesCountResult[0]?.count ?? 0;
  const dividendsCount = dividendsCountResult[0]?.count ?? 0;

  logger.info(`companies: ${companiesCount}`, { job: JOB_NAME, count: companiesCount });
  logger.info(`stocks (active): ${activeStocksCount}`, {
    job: JOB_NAME,
    count: activeStocksCount,
  });
  logger.info(`daily_prices: ${dailyPricesCount}`, { job: JOB_NAME, count: dailyPricesCount });
  logger.info(`dividends: ${dividendsCount}`, { job: JOB_NAME, count: dividendsCount });

  const [sampleStock] = await db
    .select({
      id: stocks.id,
      companyId: stocks.companyId,
      symbol: stocks.symbol,
      name: stocks.name,
      edgeCmpyId: stocks.edgeCmpyId,
      edgeSecId: stocks.edgeSecId,
      description: stocks.description,
      boardLot: stocks.boardLot,
      parValue: stocks.parValue,
      isin: stocks.isin,
      issueType: stocks.issueType,
      freeFloatLevel: stocks.freeFloatLevel,
      foreignOwnershipLimit: stocks.foreignOwnershipLimit,
      outstandingShares: stocks.outstandingShares,
      listedShares: stocks.listedShares,
      issuedShares: stocks.issuedShares,
      listingDate: stocks.listingDate,
      isBlueChip: stocks.isBlueChip,
      isActive: stocks.isActive,
      websiteUrl: stocks.websiteUrl,
      logoUrl: stocks.logoUrl,
      createdAt: stocks.createdAt,
      updatedAt: stocks.updatedAt,
    })
    .from(stocks)
    .where(eq(stocks.symbol, SAMPLE_SYMBOL))
    .limit(1);

  const sampleCompany =
    sampleStock?.companyId === null || sampleStock?.companyId === undefined
      ? null
      : (
          await db
            .select({
              id: companies.id,
              edgeCmpyId: companies.edgeCmpyId,
              name: companies.name,
              logoUrl: companies.logoUrl,
              description: companies.description,
              sector: companies.sector,
              subsector: companies.subsector,
              websiteUrl: companies.websiteUrl,
              address: companies.address,
              email: companies.email,
              phone: companies.phone,
              incorporationDate: companies.incorporationDate,
              fiscalYearEnd: companies.fiscalYearEnd,
              externalAuditor: companies.externalAuditor,
              transferAgent: companies.transferAgent,
              createdAt: companies.createdAt,
              updatedAt: companies.updatedAt,
            })
            .from(companies)
            .where(eq(companies.id, sampleStock.companyId))
            .limit(1)
        )[0] ?? null;

  const sampleDailyPrices =
    sampleStock === undefined
      ? []
      : await db
          .select({
            id: dailyPrices.id,
            stockId: dailyPrices.stockId,
            tradeDate: dailyPrices.tradeDate,
            openPrice: dailyPrices.openPrice,
            highPrice: dailyPrices.highPrice,
            lowPrice: dailyPrices.lowPrice,
            closePrice: dailyPrices.closePrice,
            volume: dailyPrices.volume,
            value: dailyPrices.value,
            percentChange: dailyPrices.percentChange,
            netForeign: dailyPrices.netForeign,
          })
          .from(dailyPrices)
          .where(eq(dailyPrices.stockId, sampleStock.id))
          .orderBy(desc(dailyPrices.tradeDate))
          .limit(5);

  const sampleDividends =
    sampleStock === undefined
      ? []
      : await db
          .select({
            id: dividends.id,
            stockId: dividends.stockId,
            securityType: dividends.securityType,
            dividendType: dividends.dividendType,
            amountPerShare: dividends.amountPerShare,
            declarationDate: dividends.declarationDate,
            exDate: dividends.exDate,
            recordDate: dividends.recordDate,
            paymentDate: dividends.paymentDate,
            fiscalYear: dividends.fiscalYear,
            createdAt: dividends.createdAt,
          })
          .from(dividends)
          .where(
            and(eq(dividends.stockId, sampleStock.id), eq(dividends.securityType, "COMMON")),
          )
          .orderBy(desc(dividends.exDate), desc(dividends.createdAt));

  logger.info(`Sample company row for ${SAMPLE_SYMBOL}`, {
    job: JOB_NAME,
    symbol: SAMPLE_SYMBOL,
    row: sampleCompany,
  });
  logger.info(`Sample stock row for ${SAMPLE_SYMBOL}`, {
    job: JOB_NAME,
    symbol: SAMPLE_SYMBOL,
    row: sampleStock ?? null,
  });
  logger.info(`5 most recent daily_prices rows for ${SAMPLE_SYMBOL}`, {
    job: JOB_NAME,
    symbol: SAMPLE_SYMBOL,
    rows: sampleDailyPrices,
  });
  logger.info(`COMMON dividends rows for ${SAMPLE_SYMBOL}`, {
    job: JOB_NAME,
    symbol: SAMPLE_SYMBOL,
    rows: sampleDividends,
  });

  const priceGaps = await db
    .select({
      symbol: stocks.symbol,
      edgeCmpyId: stocks.edgeCmpyId,
    })
    .from(stocks)
    .where(
      and(
        isNotNull(stocks.edgeCmpyId),
        sql`not exists (
          select 1
          from ${dailyPrices}
          where ${dailyPrices.stockId} = ${stocks.id}
        )`,
      ),
    )
    .orderBy(stocks.symbol);

  const unlinkedStocks = await db
    .select({
      symbol: stocks.symbol,
    })
    .from(stocks)
    .where(isNull(stocks.companyId))
    .orderBy(stocks.symbol);

  if (priceGaps.length === 0) {
    logger.info("No daily price gaps found", { job: JOB_NAME });
  } else {
    for (const gap of priceGaps) {
      logger.warn(`Gap: ${gap.symbol} (edge_cmpy_id: ${gap.edgeCmpyId}) — no daily prices`, {
        job: JOB_NAME,
        symbol: gap.symbol,
        edgeCmpyId: gap.edgeCmpyId,
      });
    }
  }

  if (unlinkedStocks.length === 0) {
    logger.info("No unlinked stocks found", { job: JOB_NAME });
  } else {
    for (const stock of unlinkedStocks) {
      logger.warn(`Unlinked: ${stock.symbol} — no company_id`, {
        job: JOB_NAME,
        symbol: stock.symbol,
      });
    }
  }

  process.exitCode = priceGaps.length > 0 || unlinkedStocks.length > 0 ? 1 : 0;
};

run().catch((error) => {
  logger.error("Backfill verification failed", {
    job: JOB_NAME,
    error: error instanceof Error ? error.message : String(error),
    cause:
      error instanceof Error && "cause" in error
        ? String((error as { cause?: unknown }).cause)
        : undefined,
  });
  process.exitCode = 1;
});
