import { load } from "cheerio";

import { DividendEntryListSchema } from "../schemas";

const normalizeText = (value: string): string => value.replace(/\s+/g, " ").trim();

const extractDividendRate = (value: string): number | null => {
  const matched = value.match(/-?\d[\d,]*(?:\.\d+)?/);

  if (!matched) {
    return null;
  }

  const parsed = Number(matched[0].replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : null;
};

export const parseDividends = (html: string) => {
  const $ = load(html);

  const rows = $('table.list:has(caption:contains("Dividend Information")) tbody tr')
    .toArray()
    .map((row) => {
      const cells = $(row).find("td");

      return {
        securityType: normalizeText(cells.eq(0).text()),
        dividendType: normalizeText(cells.eq(1).text()),
        dividendRate: extractDividendRate(normalizeText(cells.eq(2).text())),
        exDate: normalizeText(cells.eq(3).text()),
        recordDate: normalizeText(cells.eq(4).text()),
        paymentDate: normalizeText(cells.eq(5).text()),
      };
    });

  return DividendEntryListSchema.parse(rows);
};
