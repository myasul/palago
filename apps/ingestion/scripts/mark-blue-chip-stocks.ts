import { inArray } from "drizzle-orm";

import { stocks } from "@palago/db/schema";

import { db } from "../shared/db";
import { logger } from "../shared/logger";

const JOB_NAME = "mark-blue-chip-stocks";

const PSEI_SYMBOLS = [
  "AC",
  "ACEN",
  "AEV",
  "ALI",
  "AREIT",
  "BDO",
  "BPI",
  "CBC",
  "CNPF",
  "CNVRG",
  "DMC",
  "EMI",
  "GLO",
  "GTCAP",
  "ICT",
  "JFC",
  "JGS",
  "LTG",
  "MBT",
  "MER",
  "MONDE",
  "PGOLD",
  "PLUS",
  "RCR",
  "SCC",
  "SM",
  "SMC",
  "SMPH",
  "TEL",
  "URC",
] as const;

const run = async () => {
  const existingStocks = await db
    .select({
      symbol: stocks.symbol,
      isBlueChip: stocks.isBlueChip,
    })
    .from(stocks)
    .where(inArray(stocks.symbol, [...PSEI_SYMBOLS]));

  const matchedSymbols = new Set(existingStocks.map((stock) => stock.symbol));
  const missingSymbols = PSEI_SYMBOLS.filter((symbol) => !matchedSymbols.has(symbol));
  const alreadyBlueChipCount = existingStocks.filter((stock) => stock.isBlueChip === true).length;

  if (existingStocks.length === 0) {
    logger.warn("No matching stocks found for supplied PSEi composition", {
      job: JOB_NAME,
      requestedSymbols: PSEI_SYMBOLS.length,
    });
    return;
  }

  const updatedStocks = await db
    .update(stocks)
    .set({
      isBlueChip: true,
      updatedAt: new Date(),
    })
    .where(inArray(stocks.symbol, [...PSEI_SYMBOLS]))
    .returning({
      symbol: stocks.symbol,
    });

  logger.info("Marked PSEi constituents as blue-chip stocks", {
    job: JOB_NAME,
    requestedSymbols: PSEI_SYMBOLS.length,
    matchedSymbols: existingStocks.length,
    updatedStocks: updatedStocks.length,
    alreadyBlueChipCount,
  });

  if (missingSymbols.length > 0) {
    logger.warn("Some PSEi symbols were not found in stocks", {
      job: JOB_NAME,
      missingSymbols,
    });
  }
};

run().catch((error) => {
  logger.error("Failed to mark PSEi constituents as blue-chip stocks", {
    job: JOB_NAME,
    error: error instanceof Error ? error.message : String(error),
    cause:
      error instanceof Error && "cause" in error
        ? String((error as { cause?: unknown }).cause)
        : undefined,
  });
  process.exitCode = 1;
});
