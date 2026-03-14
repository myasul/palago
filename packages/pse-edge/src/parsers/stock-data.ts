import { load } from "cheerio";

import { StockDetailSnapshotSchema } from "../schemas";

const buildFieldMap = (html: string) => {
  const $ = load(html);
  const map = new Map<string, string>();

  $("table.view")
    .slice(0, 2)
    .each((_, table) => {
      $(table)
        .find("tr")
        .each((__, row) => {
          const cells = $(row).find("th, td").toArray();

          for (let index = 0; index < cells.length; index += 2) {
            const label = $(cells[index]).text().replace(/\s+/g, " ").trim();
            const value = $(cells[index + 1]).text().replace(/\s+/g, " ").trim();

            if (label) {
              map.set(label, value);
            }
          }
        });
    });

  return { $, map };
};

export const parseStockData = (html: string, edgeCmpyId: string) => {
  const { $, map } = buildFieldMap(html);
  const selectedSecurity = $('select[name="security_id"] option').first();

  return StockDetailSnapshotSchema.parse({
    edgeCmpyId,
    edgeSecId: selectedSecurity.attr("value"),
    securitySymbol: selectedSecurity.text(),
    currentPrice: map.get("Last Traded Price"),
    openPrice: map.get("Open"),
    highPrice: map.get("High"),
    lowPrice: map.get("Low"),
    volume: map.get("Volume"),
    value: map.get("Value"),
    percentChange: map.get("Change(% Change)"),
    high52Week: map.get("52-Week High"),
    low52Week: map.get("52-Week Low"),
    boardLot: map.get("Board Lot"),
    isin: map.get("ISIN"),
    issueType: map.get("Issue Type"),
    outstandingShares: map.get("Outstanding Shares"),
    listedShares: map.get("Listed Shares"),
    issuedShares: map.get("Issued Shares"),
    freeFloatLevel: map.get("Free Float Level(%)"),
    parValue: map.get("Par Value"),
    foreignOwnershipLimit: map.get("Foreign Ownership Limit(%)"),
    listingDate: map.get("Listing Date"),
  });
};
