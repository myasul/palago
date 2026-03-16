import { z } from "zod";

import { toNullableDate, toRequiredChartDate } from "./utils/dates";
import { toNullableNumber, toNullablePercent, toNullablePercentChange } from "./utils/numbers";

const nonEmptyString = z.string().trim().min(1);

const nullableString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}, z.string().nullable());

const nullableNumber = z.preprocess((value) => toNullableNumber(value), z.number().nullable());

const nullablePercent = z.preprocess((value) => toNullablePercent(value), z.number().nullable());

const nullablePercentChange = z.preprocess((value) => toNullablePercentChange(value), z.number().nullable());

const nullableDate = z.preprocess((value) => toNullableDate(value), z.date().nullable());

const requiredChartDate = z.preprocess((value) => toRequiredChartDate(value), z.date());

const nullableAbsoluteUrl = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}, z.url().nullable());

export const ListedCompanyEntrySchema = z.object({
  symbol: nonEmptyString,
  name: nonEmptyString,
  sector: nullableString,
  subsector: nullableString,
  listingDate: nullableDate,
  edgeCmpyId: nonEmptyString,
  edgeSecId: nonEmptyString,
});

export const ListedCompanyListSchema = z.array(ListedCompanyEntrySchema);

export const StockDetailSnapshotSchema = z.object({
  edgeCmpyId: nonEmptyString,
  edgeSecId: nonEmptyString,
  securitySymbol: nonEmptyString,
  currentPrice: nullableNumber,
  openPrice: nullableNumber,
  highPrice: nullableNumber,
  lowPrice: nullableNumber,
  volume: nullableNumber,
  value: nullableNumber,
  percentChange: nullablePercentChange,
  high52Week: nullableNumber,
  low52Week: nullableNumber,
  boardLot: nullableNumber,
  isin: nullableString,
  issueType: nullableString,
  outstandingShares: nullableNumber,
  listedShares: nullableNumber,
  issuedShares: nullableNumber,
  freeFloatLevel: nullablePercent,
  parValue: nullableNumber,
  foreignOwnershipLimit: nullablePercent,
  listingDate: nullableDate,
});

export const CompanyProfileSchema = z.object({
  edgeCmpyId: nonEmptyString,
  description: nullableString,
  sector: nullableString,
  subsector: nullableString,
  incorporationDate: nullableDate,
  fiscalYearEnd: nullableString,
  externalAuditor: nullableString,
  transferAgent: nullableString,
  address: nullableString,
  email: nullableString,
  phone: nullableString,
  websiteUrl: nullableAbsoluteUrl,
  logoUrl: nullableAbsoluteUrl,
});

export const DividendEntrySchema = z.object({
  securityType: nonEmptyString,
  dividendType: nonEmptyString,
  dividendRate: z.number().nullable(),
  exDate: nullableDate,
  recordDate: nullableDate,
  paymentDate: nullableDate,
});

export const DividendEntryListSchema = z.array(DividendEntrySchema);

export const HistoricalPricePointSchema = z.object({
  edgeCmpyId: nonEmptyString,
  edgeSecId: nonEmptyString,
  tradeDate: requiredChartDate,
  openPrice: nullableNumber,
  highPrice: nullableNumber,
  lowPrice: nullableNumber,
  closePrice: nullableNumber,
  value: nullableNumber,
  volume: z.null(),
});

export const HistoricalPricePointListSchema = z.array(HistoricalPricePointSchema);
