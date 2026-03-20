import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq, isNotNull } from "drizzle-orm";

import { companies, stocks } from "@palago/db/schema";
import { PSEEdgeProvider } from "@palago/pse-edge";

import { db } from "../shared/db";
import { logger } from "../shared/logger";
import { sleep } from "../shared/sleep";

const JOB_NAME = "seed-companies";
const LOGO_BUCKET = "palago-assets";
const LOGO_BASE_URL =
  "https://palago-assets.s3.ap-southeast-1.amazonaws.com/logos";
const COMPANY_DELAY_MS = 1000;

const s3 = new S3Client({ region: "ap-southeast-1" });
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

const uploadLogo = async (symbol: string, sourceLogoUrl: string) => {
  const response = await fetch(sourceLogoUrl);

  if (!response.ok) {
    throw new Error(`logo download failed with status ${response.status}`);
  }

  const bytes = await response.arrayBuffer();
  const key = `logos/${symbol}.jpg`;

  await s3.send(
    new PutObjectCommand({
      Bucket: LOGO_BUCKET,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: "image/jpeg",
    })
  );

  return `${LOGO_BASE_URL}/${symbol}.jpg`;
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const listedCompanies = await provider.getCompanyList();
  const existingCompanies = await db
    .select({ edgeCmpyId: companies.edgeCmpyId })
    .from(companies)
    .where(isNotNull(companies.edgeCmpyId));
  const existingEdgeCmpyIds = new Set(existingCompanies.map((row) => row.edgeCmpyId));
  const firstMissingIndex = listedCompanies.findIndex(
    (company) => company.edgeCmpyId && !existingEdgeCmpyIds.has(company.edgeCmpyId),
  );
  const startIndex =
    options.startAt !== null
      ? options.startAt - 1
      : firstMissingIndex === -1
        ? listedCompanies.length
        : firstMissingIndex;

  let companiesProcessed = 0;
  let companiesSkipped = 0;
  let companyFailures = 0;
  let stocksUpserted = 0;
  let logoUploadSuccesses = 0;
  let logoUploadFailures = 0;

  if (startIndex > listedCompanies.length) {
    throw new Error(
      `--start-at ${options.startAt} is outside the company list (total ${listedCompanies.length})`,
    );
  }

  logger.info("Resolved seed-companies starting point", {
    job: JOB_NAME,
    mode: options.startAt === null ? "auto-resume" : "manual-start",
    startAt: startIndex + 1,
    totalCompanies: listedCompanies.length,
    existingCompanies: existingEdgeCmpyIds.size,
  });

  if (startIndex === listedCompanies.length) {
    logger.info("All listed companies already exist; nothing to seed", {
      job: JOB_NAME,
      totalCompanies: listedCompanies.length,
      existingCompanies: existingEdgeCmpyIds.size,
    });
    return;
  }

  for (const [index, company] of listedCompanies.entries()) {
    if (index < startIndex) {
      continue;
    }

    if (
      options.startAt === null &&
      company.edgeCmpyId &&
      existingEdgeCmpyIds.has(company.edgeCmpyId)
    ) {
      companiesSkipped += 1;
      logger.info(`[${index + 1}/${listedCompanies.length}] ${company.symbol} skipped`, {
        job: JOB_NAME,
        symbol: company.symbol,
        edgeCmpyId: company.edgeCmpyId,
        reason: "company already exists",
      });
      continue;
    }

    if (!company.edgeCmpyId) {
      companiesSkipped += 1;
      logger.warn("Skipping company without edgeCmpyId", {
        job: JOB_NAME,
        index: index + 1,
        symbol: company.symbol,
        name: company.name,
      });
      continue;
    }

    try {
      const profile = await provider.getCompanyInfo(company.edgeCmpyId);
      let finalLogoUrl = profile.logoUrl;

      if (profile.logoUrl) {
        try {
          finalLogoUrl = await uploadLogo(company.symbol, profile.logoUrl);
          logoUploadSuccesses += 1;
        } catch (error) {
          logoUploadFailures += 1;
          finalLogoUrl = profile.logoUrl;
          logger.warn("Logo upload failed, falling back to source logo URL", {
            job: JOB_NAME,
            symbol: company.symbol,
            edgeCmpyId: company.edgeCmpyId,
            logoUrl: profile.logoUrl,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const [upsertedCompany] = await db
        .insert(companies)
        .values({
          edgeCmpyId: company.edgeCmpyId,
          name: company.name,
          logoUrl: finalLogoUrl,
          description: profile.description,
          sector: profile.sector,
          subsector: profile.subsector,
          websiteUrl: profile.websiteUrl,
          address: profile.address,
          email: profile.email,
          phone: profile.phone,
          incorporationDate: toSqlDate(profile.incorporationDate),
          fiscalYearEnd: profile.fiscalYearEnd,
          externalAuditor: profile.externalAuditor,
          transferAgent: profile.transferAgent,
        })
        .onConflictDoUpdate({
          target: companies.edgeCmpyId,
          set: {
            name: company.name,
            logoUrl: finalLogoUrl,
            description: profile.description,
            sector: profile.sector,
            subsector: profile.subsector,
            websiteUrl: profile.websiteUrl,
            address: profile.address,
            email: profile.email,
            phone: profile.phone,
            incorporationDate: toSqlDate(profile.incorporationDate),
            fiscalYearEnd: profile.fiscalYearEnd,
            externalAuditor: profile.externalAuditor,
            transferAgent: profile.transferAgent,
          },
        })
        .returning({ id: companies.id });

      const companyId =
        upsertedCompany?.id ??
        (
          await db
            .select({ id: companies.id })
            .from(companies)
            .where(eq(companies.edgeCmpyId, company.edgeCmpyId))
            .limit(1)
        )[0]?.id;

      if (!companyId) {
        throw new Error(
          `Failed to resolve company_id for edge_cmpy_id ${company.edgeCmpyId}`,
        );
      }

      await db
        .insert(stocks)
        .values({
          symbol: company.symbol,
          name: company.name,
          edgeCmpyId: company.edgeCmpyId,
          edgeSecId: company.edgeSecId,
          listingDate: toSqlDate(company.listingDate),
          companyId,
        })
        .onConflictDoUpdate({
          target: stocks.symbol,
          set: {
            name: company.name,
            edgeCmpyId: company.edgeCmpyId,
            edgeSecId: company.edgeSecId,
            listingDate: toSqlDate(company.listingDate),
            companyId,
          },
        });

      companiesProcessed += 1;
      stocksUpserted += 1;
      existingEdgeCmpyIds.add(company.edgeCmpyId);

      logger.info(
        `[${index + 1}/${listedCompanies.length}] ${company.symbol} company and stock upserted`,
        {
          job: JOB_NAME,
          symbol: company.symbol,
          edgeCmpyId: company.edgeCmpyId,
        },
      );
    } catch (error) {
      companyFailures += 1;
      logger.warn("Company seed failed; continuing with next company", {
        job: JOB_NAME,
        index: index + 1,
        symbol: company.symbol,
        edgeCmpyId: company.edgeCmpyId,
        error: error instanceof Error ? error.message : String(error),
        cause:
          error instanceof Error && "cause" in error
            ? String((error as { cause?: unknown }).cause)
            : undefined,
      });
    }

    if (index < listedCompanies.length - 1) {
      await sleep(COMPANY_DELAY_MS);
    }
  }

  logger.info(`Companies processed: ${companiesProcessed}`, { job: JOB_NAME });
  logger.info(`Companies skipped: ${companiesSkipped}`, { job: JOB_NAME });
  logger.info(`Company failures: ${companyFailures}`, { job: JOB_NAME });
  logger.info(`Stocks upserted: ${stocksUpserted}`, { job: JOB_NAME });
  logger.info(`Logo upload successes: ${logoUploadSuccesses}`, {
    job: JOB_NAME,
  });
  logger.info(`Logo upload failures: ${logoUploadFailures}`, { job: JOB_NAME });
};

run().catch((error) => {
  logger.error("Seed companies backfill failed", {
    job: JOB_NAME,
    error: error instanceof Error ? error.message : String(error),
    cause:
      error instanceof Error && "cause" in error
        ? String((error as { cause?: unknown }).cause)
        : undefined,
  });
  process.exitCode = 1;
});
