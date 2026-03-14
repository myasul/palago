import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseStockData } from "../src/parsers/stock-data";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stockFixturePath = path.resolve(__dirname, "../../pse-data/stockData.html");

describe("parseStockData", () => {
  it("extracts the first security and market snapshot from the stock data fixture", () => {
    const html = readFileSync(stockFixturePath, "utf8");
    const stockData = parseStockData(html, "86");

    expect(stockData).toEqual({
      edgeCmpyId: "86",
      edgeSecId: "158",
      securitySymbol: "JFC",
      currentPrice: 190,
      openPrice: 199.1,
      highPrice: 199.2,
      lowPrice: 190,
      volume: 1253530,
      value: 242069641,
      percentChange: -4.52,
      high52Week: 263.8,
      low52Week: 172.7,
      boardLot: 10,
      isin: "PHY4466S1007",
      issueType: "Common",
      outstandingShares: 1120664978,
      listedShares: 1137108318,
      issuedShares: 1137108318,
      freeFloatLevel: 46.32,
      parValue: 1,
      foreignOwnershipLimit: 100,
      listingDate: new Date("1993-07-14T00:00:00.000Z"),
    });
  });

  it("throws when the default security selector is missing", () => {
    expect(() => parseStockData("<html><body><table class=\"view\"></table></body></html>", "86")).toThrow();
  });
});
