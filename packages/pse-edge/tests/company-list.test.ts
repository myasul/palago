import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseCompanyList } from "../src/parsers/company-list";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const searchFixturePath = path.resolve(__dirname, "../../pse-data/search.html");

describe("parseCompanyList", () => {
  it("extracts listed companies and provider IDs from the search fixture", () => {
    const html = readFileSync(searchFixturePath, "utf8");
    const companies = parseCompanyList(html);

    expect(companies.length).toBeGreaterThan(0);
    expect(companies[0]).toEqual({
      symbol: "AAA",
      name: "Asia Amalgamated Holdings Corporation",
      sector: "Holding Firms",
      subsector: "Holding Firms",
      listingDate: new Date("1973-03-22T00:00:00.000Z"),
      edgeCmpyId: "55",
      edgeSecId: "347",
    });
  });

  it("throws when a row is missing the required company identifiers", () => {
    expect(() =>
      parseCompanyList(
        '<table class="list"><tbody><tr><td><a href="#company">Broken</a></td><td><a href="#company">BRK</a></td><td></td><td></td><td></td></tr></tbody></table>',
      ),
    ).toThrow(/Unable to extract company and security IDs/);
  });
});
