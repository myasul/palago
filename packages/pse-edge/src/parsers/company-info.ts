import { load } from "cheerio";

import { CompanyProfileSchema } from "../schemas";

const ABSOLUTE_LOGO_BASE_URL = "https://edge.pse.com.ph/clogo";

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

const extractSymbol = ($: ReturnType<typeof load>) => {
  const logoSrc = $(".compInfo img").attr("src") ?? "";
  const matched = logoSrc.match(/co_([^_]+)_logo\.jpg/i);

  return matched?.[1] ?? null;
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

export const parseCompanyInfo = (html: string, edgeCmpyId: string) => {
  const { $, map } = buildFieldMap(html);
  const description = $("#dataList table.view").first().find("td").first().text().replace(/\s+/g, " ").trim();
  const symbol = extractSymbol($);

  return CompanyProfileSchema.parse({
    edgeCmpyId,
    symbol,
    description,
    sector: map.get("Sector"),
    subsector: map.get("Subsector"),
    incorporationDate: map.get("Incorporation Date"),
    fiscalYearEnd: map.get("Fiscal Year"),
    externalAuditor: map.get("External Auditor"),
    transferAgent: map.get("Transfer Agent"),
    address: map.get("Business Address"),
    email: toNullableEmail(map.get("E-mail Address")),
    phone: map.get("Telephone Number"),
    websiteUrl: toNullableAbsoluteUrl(map.get("Website")),
    logoUrl: symbol ? `${ABSOLUTE_LOGO_BASE_URL}/co_${symbol}_logo.jpg` : null,
  });
};
