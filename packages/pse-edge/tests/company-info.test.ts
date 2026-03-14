import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseCompanyInfo } from "../src/parsers/company-info";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const companyInfoFixturePath = path.resolve(__dirname, "../../pse-data/company_information.html");

describe("parseCompanyInfo", () => {
  it("extracts the company profile and builds the absolute logo URL", () => {
    const html = readFileSync(companyInfoFixturePath, "utf8");
    const companyInfo = parseCompanyInfo(html, "86");

    expect(companyInfo.edgeCmpyId).toBe("86");
    expect(companyInfo.symbol).toBe("JFC");
    expect(companyInfo.sector).toBe("Industrial");
    expect(companyInfo.subsector).toBe("Food, Beverage & Tobacco");
    expect(companyInfo.incorporationDate).toEqual(new Date("1978-01-11T00:00:00.000Z"));
    expect(companyInfo.fiscalYearEnd).toBe("12/31 (Month/Day)");
    expect(companyInfo.externalAuditor).toBe("SyCip, Gorres, Velayo & Company");
    expect(companyInfo.transferAgent).toBe("RCBC Trust Corporation");
    expect(companyInfo.address).toBe(
      "10/F Jollibee Plaza Building, Emerald Ave., Ortigas Center, Pasig City 1600",
    );
    expect(companyInfo.email).toBeNull();
    expect(companyInfo.phone).toBe("(632) 8634-1111");
    expect(companyInfo.websiteUrl).toBe("https://jollibeegroup.com/");
    expect(companyInfo.logoUrl).toBe("https://edge.pse.com.ph/clogo/co_JFC_logo.jpg");
    expect(companyInfo.description).toContain("Jollibee Foods Corporation (JFC) was incorporated");
  });

  it("throws when the fixture does not contain a required symbol source", () => {
    const html = '<div id="dataList"><table class="view"><td>Example description</td></table></div>';

    expect(() => parseCompanyInfo(html, "86")).toThrow();
  });
});
