import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseHistoricalPrices } from "../src/parsers/historical-prices";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const historicalFixturePath = path.resolve(__dirname, "../../pse-data/disclosure-cht.json");

describe("parseHistoricalPrices", () => {
  it("extracts historical rows, normalizes scientific notation, and sets volume to null", () => {
    const payload = readFileSync(historicalFixturePath, "utf8");
    const rows = parseHistoricalPrices(payload, "86", "158");

    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({
      edgeCmpyId: "86",
      edgeSecId: "158",
      tradeDate: new Date("2026-03-11T00:00:00.000Z"),
      openPrice: 195.7,
      highPrice: 202.6,
      lowPrice: 195.7,
      closePrice: 200,
      value: 132369927,
      volume: null,
    });
  });

  it("throws on invalid required chart dates", () => {
    expect(() =>
      parseHistoricalPrices(
        {
          chartData: [
            {
              OPEN: 1,
              HIGH: 2,
              LOW: 0.5,
              CLOSE: 1.5,
              VALUE: 1000,
              CHART_DATE: "bad date",
            },
          ],
        },
        "86",
        "158",
      ),
    ).toThrow(/Invalid chart date/);
  });
});
