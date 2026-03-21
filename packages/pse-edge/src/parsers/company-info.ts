import { load } from "cheerio";

import { CompanyProfileSchema } from "../schemas";

const ABSOLUTE_PSE_EDGE_BASE_URL = "https://edge.pse.com.ph";

const buildFieldMap = (html: string) => {
  const $ = load(html);
  const map = new Map<string, string>();

  $("#dataList table.view")
    .slice(1)
    .each((_, table) => {
      $(table)
        .find("tr")
        .each((__, row) => {
          const label = $(row).find("th").first().text().replace(/\s+/g, " ").trim();
          const value = $(row).find("td").first().text().replace(/\s+/g, " ").trim();

          if (label) {
            map.set(label, value);
          }
        });
    });

  return { $, map };
};

const extractLogoUrl = ($: ReturnType<typeof load>) => {
  const logoSrc = $(".compInfo img").attr("src")?.trim();

  if (!logoSrc) {
    return null;
  }

  try {
    return new URL(logoSrc, ABSOLUTE_PSE_EDGE_BASE_URL).toString();
  } catch {
    return null;
  }
};

const toNullableEmail = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  return /\[email/i.test(value) ? null : value;
};

const toNullableAbsoluteUrl = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
};

const toNullableFiscalYearEnd = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  const matched = value.match(/\b(\d{2}\/\d{2})\b/);
  return matched?.[1] ?? null;
};

export const parseCompanyInfo = (html: string, edgeCmpyId: string) => {
  const { $, map } = buildFieldMap(html);
  const description = $("#dataList table.view").first().find("td").first().text().replace(/\s+/g, " ").trim();
  const logoUrl = extractLogoUrl($);

  return CompanyProfileSchema.parse({
    edgeCmpyId,
    description,
    sector: map.get("Sector"),
    subsector: map.get("Subsector"),
    incorporationDate: map.get("Incorporation Date"),
    fiscalYearEnd: toNullableFiscalYearEnd(map.get("Fiscal Year")),
    externalAuditor: map.get("External Auditor"),
    transferAgent: map.get("Transfer Agent"),
    address: map.get("Business Address"),
    email: toNullableEmail(map.get("E-mail Address")),
    phone: map.get("Telephone Number"),
    websiteUrl: toNullableAbsoluteUrl(map.get("Website")),
    logoUrl,
  });
};
