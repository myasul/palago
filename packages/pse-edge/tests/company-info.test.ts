import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseCompanyInfo } from "../src/parsers/company-info";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const companyInfoFixturePath = path.resolve(__dirname, "../../pse-data/company_information.html");

describe("parseCompanyInfo", () => {
  it("extracts the company profile and reads the absolute logo URL from the page image source", () => {
    const html = readFileSync(companyInfoFixturePath, "utf8");
    const companyInfo = parseCompanyInfo(html, "86");

    expect(companyInfo.edgeCmpyId).toBe("86");
    expect(companyInfo.sector).toBe("Industrial");
    expect(companyInfo.subsector).toBe("Food, Beverage & Tobacco");
    expect(companyInfo.incorporationDate).toEqual(new Date("1978-01-11T00:00:00.000Z"));
    expect(companyInfo.fiscalYearEnd).toBe("12/31");
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

  it("returns a null logo URL when the page does not expose a logo image", () => {
    const html = '<div id="dataList"><table class="view"><td>Example description</td></table></div>';

    expect(parseCompanyInfo(html, "86")).toMatchObject({
      edgeCmpyId: "86",
      description: "Example description",
      logoUrl: null,
    });
  });

  it("converts a non-pattern relative logo path to an absolute PSE Edge URL", () => {
    const html = `
      <div class="compInfo">
        <span><img src="/clogo/234/cl61a83813r307.jpg" alt="Logo" /></span>
      </div>
      <div id="dataList">
        <table class="view"><tr><td>Example description</td></tr></table>
      </div>
    `;

    expect(parseCompanyInfo(html, "86")).toMatchObject({
      edgeCmpyId: "86",
      description: "Example description",
      logoUrl: "https://edge.pse.com.ph/clogo/234/cl61a83813r307.jpg",
    });
  });
});
