import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { PSEEdgeProvider } from "../src/provider";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stockFixturePath = path.resolve(__dirname, "../../pse-data/stockData.html");
const companyInfoFixturePath = path.resolve(__dirname, "../../pse-data/company_information.html");

describe("PSEEdgeProvider company detail methods", () => {
  it("fetches and parses stock data for the requested company", async () => {
    const html = readFileSync(stockFixturePath, "utf8");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(html, { status: 200 }));
    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    const stockData = await provider.getStockData("86");

    expect(fetchMock).toHaveBeenCalledWith("https://edge.pse.com.ph/companyPage/stockData.do?cmpy_id=86");
    expect(stockData.edgeCmpyId).toBe("86");
    expect(stockData.edgeSecId).toBe("158");
    expect(stockData.securitySymbol).toBe("JFC");
    expect(stockData.currentPrice).toBe(190);
    expect(stockData.foreignOwnershipLimit).toBe(100);
  });

  it("returns null for optional stock fields that are missing or unparseable", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        `
          <html>
            <body>
              <select name="security_id">
                <option value="158" selected>JFC</option>
              </select>
              <table class="view">
                <tr><th>Issue Type</th><td>Common</td><th>Outstanding Shares</th><td>oops</td></tr>
                <tr><th>ISIN</th><td></td><th>Listed Shares</th><td>1,137,108,318</td></tr>
                <tr><th>Listing Date</th><td></td><th>Issued Shares</th><td>1,137,108,318</td></tr>
                <tr><th>Board Lot</th><td></td><th>Free Float Level(%)</th><td>bad%</td></tr>
                <tr><th>Par Value</th><td>1.00</td><th>Foreign Ownership Limit(%)</th><td>No Limit</td></tr>
              </table>
              <table class="view">
                <tr><th>Last Traded Price</th><td></td><th>Open</th><td>bad</td><th>Previous Close and Date</th><td></td></tr>
                <tr><th>Change(% Change)</th><td></td><th>High</th><td>1.25</td><th>P/E Ratio</th><td></td></tr>
                <tr><th>Value</th><td>1.23E4</td><th>Low</th><td></td><th>Sector P/E Ratio</th><td></td></tr>
                <tr><th>Volume</th><td>oops</td><th>Average Price</th><td></td><th>Book Value</th><td></td></tr>
                <tr><th>52-Week High</th><td></td><th>52-Week Low</th><td>0.50</td><th>P/BV Ratio</th><td></td></tr>
              </table>
            </body>
          </html>
        `,
        { status: 200 },
      ),
    );
    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    const stockData = await provider.getStockData("86");

    expect(stockData.currentPrice).toBeNull();
    expect(stockData.openPrice).toBeNull();
    expect(stockData.volume).toBeNull();
    expect(stockData.outstandingShares).toBeNull();
    expect(stockData.freeFloatLevel).toBeNull();
    expect(stockData.foreignOwnershipLimit).toBeNull();
    expect(stockData.value).toBe(12300);
    expect(stockData.low52Week).toBe(0.5);
    expect(stockData.listedShares).toBe(1137108318);
  });

  it("fetches and parses company information with an absolute logo URL", async () => {
    const html = readFileSync(companyInfoFixturePath, "utf8");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(html, { status: 200 }));
    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    const companyInfo = await provider.getCompanyInfo("86");

    expect(fetchMock).toHaveBeenCalledWith("https://edge.pse.com.ph/companyInformation/form.do?cmpy_id=86");
    expect(companyInfo.edgeCmpyId).toBe("86");
    expect(companyInfo.symbol).toBe("JFC");
    expect(companyInfo.logoUrl).toBe("https://edge.pse.com.ph/clogo/co_JFC_logo.jpg");
    expect(companyInfo.websiteUrl).toBe("https://jollibeegroup.com/");
  });

  it("returns null for optional company info fields that are missing or unparseable", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        `
          <div class="compInfo">
            <span><img src="/clogo/co_TEST_logo.jpg" alt="Logo" /></span>
          </div>
          <div id="dataList">
            <table class="view"><tr><td>Example company description</td></tr></table>
            <table class="view">
              <tr><th>Sector</th><td></td></tr>
              <tr><th>Subsector</th><td></td></tr>
              <tr><th>Incorporation Date</th><td>not-a-date</td></tr>
              <tr><th>Fiscal Year</th><td></td></tr>
              <tr><th>External Auditor</th><td></td></tr>
              <tr><th>Transfer Agent</th><td></td></tr>
            </table>
            <table class="view">
              <tr><th>Business Address</th><td></td></tr>
              <tr><th>E-mail Address</th><td>[email protected]</td></tr>
              <tr><th>Telephone Number</th><td></td></tr>
              <tr><th>Website</th><td>not-a-url</td></tr>
            </table>
          </div>
        `,
        { status: 200 },
      ),
    );
    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    const companyInfo = await provider.getCompanyInfo("99");

    expect(companyInfo.symbol).toBe("TEST");
    expect(companyInfo.sector).toBeNull();
    expect(companyInfo.subsector).toBeNull();
    expect(companyInfo.incorporationDate).toBeNull();
    expect(companyInfo.fiscalYearEnd).toBeNull();
    expect(companyInfo.externalAuditor).toBeNull();
    expect(companyInfo.transferAgent).toBeNull();
    expect(companyInfo.address).toBeNull();
    expect(companyInfo.email).toBeNull();
    expect(companyInfo.phone).toBeNull();
    expect(companyInfo.websiteUrl).toBeNull();
    expect(companyInfo.logoUrl).toBe("https://edge.pse.com.ph/clogo/co_TEST_logo.jpg");
  });

  it("throws an explicit error when a stock data request fails", async () => {
    const provider = new PSEEdgeProvider({
      fetchFn: vi.fn<typeof fetch>().mockResolvedValue(new Response("nope", { status: 404 })),
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    await expect(provider.getStockData("86")).rejects.toThrow(
      "PSE Edge stock data request failed for cmpy_id 86 with status 404",
    );
  });

  it("throws an explicit error when a company info request fails", async () => {
    const provider = new PSEEdgeProvider({
      fetchFn: vi.fn<typeof fetch>().mockResolvedValue(new Response("nope", { status: 500 })),
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    await expect(provider.getCompanyInfo("86")).rejects.toThrow(
      "PSE Edge company info request failed for cmpy_id 86 with status 500",
    );
  });
});
