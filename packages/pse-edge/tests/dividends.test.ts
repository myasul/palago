import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseDividends } from "../src/parsers/dividends";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dividendsFixturePath = path.resolve(__dirname, "../../pse-data/dividends.html");

describe("parseDividends", () => {
  it("returns all dividend rows and normalizes dividend rate values", () => {
    const html = readFileSync(dividendsFixturePath, "utf8");
    const dividends = parseDividends(html);

    expect(dividends).toHaveLength(7);
    expect(dividends[0]).toEqual({
      securityType: "JFCPB",
      dividendType: "Cash",
      dividendRate: 10.60125,
      exDate: new Date("2026-03-23T00:00:00.000Z"),
      recordDate: new Date("2026-03-24T00:00:00.000Z"),
      paymentDate: new Date("2026-04-15T00:00:00.000Z"),
    });

    expect(dividends.some((entry) => entry.securityType === "COMMON")).toBe(true);
    expect(dividends.some((entry) => entry.securityType === "JFCPB")).toBe(true);

    const commonTwoEleven = dividends.find((entry) => entry.dividendRate === 2.11);
    expect(commonTwoEleven).toBeDefined();
    expect(commonTwoEleven?.securityType).toBe("COMMON");

    const commonOneThirtyThree = dividends.find((entry) => entry.dividendRate === 1.33);
    expect(commonOneThirtyThree).toBeDefined();
    expect(commonOneThirtyThree?.securityType).toBe("COMMON");

    expect(typeof dividends[0]?.dividendRate).toBe("number");
  });

  it("returns optional missing date fields as null instead of undefined", () => {
    const dividends = parseDividends(`
      <table class="list">
        <caption>Dividend Information</caption>
        <tbody>
          <tr>
            <td class="alignC">COMMON</td>
            <td class="alignC">Cash</td>
            <td class="alignR">Php2.11</td>
            <td class="alignC"></td>
            <td class="alignC"></td>
            <td class="alignC"></td>
            <td class="alignC"></td>
          </tr>
        </tbody>
      </table>
    `);

    expect(dividends[0]).toEqual({
      securityType: "COMMON",
      dividendType: "Cash",
      dividendRate: 2.11,
      exDate: null,
      recordDate: null,
      paymentDate: null,
    });
    expect(dividends[0]?.exDate).toBeNull();
    expect(dividends[0]?.recordDate).toBeNull();
    expect(dividends[0]?.paymentDate).toBeNull();
  });
});
