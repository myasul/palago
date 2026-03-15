import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";

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
  const listedCompanies = await provider.getCompanyList();

  let companiesProcessed = 0;
  let stocksUpserted = 0;
  let logoUploadSuccesses = 0;
  let logoUploadFailures = 0;

  for (const [index, company] of listedCompanies.entries()) {
    if (!company.edgeCmpyId) {
      logger.warn("Skipping company without edgeCmpyId", {
        job: JOB_NAME,
        index: index + 1,
        symbol: company.symbol,
        name: company.name,
      });

      if (index < listedCompanies.length - 1) {
        await sleep(COMPANY_DELAY_MS);
      }

      continue;
    }

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
        `Failed to resolve company_id for edge_cmpy_id ${company.edgeCmpyId}`
      );
    }

    await db
      .insert(stocks)
      .values({
        symbol: company.symbol,
        name: company.name,
        edgeCmpyId: company.edgeCmpyId,
        edgeSecId: company.edgeSecId,
        sector: company.sector,
        subsector: company.subsector,
        listingDate: toSqlDate(company.listingDate),
        companyId,
      })
      .onConflictDoUpdate({
        target: stocks.symbol,
        set: {
          name: company.name,
          edgeCmpyId: company.edgeCmpyId,
          edgeSecId: company.edgeSecId,
          sector: company.sector,
          subsector: company.subsector,
          listingDate: toSqlDate(company.listingDate),
          companyId,
        },
      });

    companiesProcessed += 1;
    stocksUpserted += 1;

    logger.info(
      `[${companiesProcessed}/${listedCompanies.length}] ${company.symbol} — company and stock upserted`,
      {
        job: JOB_NAME,
        symbol: company.symbol,
        edgeCmpyId: company.edgeCmpyId,
      }
    );

    if (index < listedCompanies.length - 1) {
      await sleep(COMPANY_DELAY_MS);
    }
  }

  logger.info(`Companies processed: ${companiesProcessed}`, { job: JOB_NAME });
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
  });
  process.exitCode = 1;
});
