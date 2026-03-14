import { readFile } from "node:fs/promises";
import path from "node:path";

import { db, sql } from "../client";
import { loadRepoEnv, resolvePackageRoot } from "../load-env";
import { stocks } from "../schema";
import { parse } from "csv-parse/sync";

const PSEI_COMPONENTS = new Set([
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
]);

type PseCompanyRow = {
  "Company Name ": string;
  "Symbol ": string;
  "Sector ": string;
  "Sub-Sector ": string;
  "Listing Date ": string;
  "Listing Board ": string;
};

loadRepoEnv(import.meta.url);

const packageRoot = resolvePackageRoot(import.meta.url);
const csvPath = path.resolve(packageRoot, "data/pse-companies.csv");

const parseListingDate = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const run = async () => {
  const csvContent = await readFile(csvPath, "utf8");
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: false,
  }) as PseCompanyRow[];

  const values = rows
    .map((row) => {
      const symbol = row["Symbol "].trim().toUpperCase();
      if (!symbol) {
        return null;
      }

      return {
        symbol,
        name: row["Company Name "].trim(),
        sector: row["Sector "].trim() || null,
        subsector: row["Sub-Sector "].trim() || null,
        listingDate: parseListingDate(row["Listing Date "]),
        isBlueChip: PSEI_COMPONENTS.has(symbol),
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  const inserted = await db
    .insert(stocks)
    .values(values)
    .onConflictDoNothing({
      target: stocks.symbol,
    })
    .returning({ id: stocks.id });

  console.log(`Inserted ${inserted.length} stock rows`);
  await sql.end();
};

run().catch(async (error) => {
  console.error("Failed to seed stocks", error);
  await sql.end({ timeout: 0 });
  process.exit(1);
});
