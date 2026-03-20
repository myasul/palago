import {
  extractLastCompanyListPage,
  parseCompanyList,
} from "./parsers/company-list";
import { parseCompanyInfo } from "./parsers/company-info";
import { parseDividends } from "./parsers/dividends";
import { parseHistoricalPrices } from "./parsers/historical-prices";
import { parseStockData } from "./parsers/stock-data";
import type {
  CompanyProfile,
  DividendEntry,
  HistoricalPricePoint,
  IPSEDataProvider,
  ListedCompanyEntry,
  StockDetailSnapshot,
} from "./types";
import { sleep } from "./utils/sleep";

const COMPANY_DIRECTORY_URL =
  "https://edge.pse.com.ph/companyDirectory/search.ax";
const COMPANY_INFORMATION_URL =
  "https://edge.pse.com.ph/companyInformation/form.do";
const DIVIDENDS_FORM_URL =
  "https://edge.pse.com.ph/companyPage/dividends_and_rights_form.do";
const DIVIDENDS_LIST_URL =
  "https://edge.pse.com.ph/companyPage/dividends_and_rights_list.ax";
const DISCLOSURE_CHART_URL = "https://edge.pse.com.ph/common/DisclosureCht.ax";
const STOCK_DATA_URL = "https://edge.pse.com.ph/companyPage/stockData.do";
const REQUEST_THROTTLE_MS = 500;

type FetchLike = typeof fetch;
type SleepLike = typeof sleep;

type PSEEdgeProviderOptions = {
  fetchFn?: FetchLike;
  sleepFn?: SleepLike;
};

const buildCompanyListPayload = (pageNo: number) =>
  new URLSearchParams({
    pageNo: String(pageNo),
    companyId: "",
    keyword: "",
    sortType: "",
    dateSortType: "DESC",
    cmpySortType: "ASC",
    symbolSortType: "ASC",
    sector: "ALL",
    subsector: "ALL",
  });

const buildDividendsPayload = (edgeCmpyId: string) =>
  new URLSearchParams({
    cmpy_id: edgeCmpyId,
  });

export class PSEEdgeProvider implements IPSEDataProvider {
  private readonly fetchFn: FetchLike;
  private readonly sleepFn: SleepLike;

  constructor(options: PSEEdgeProviderOptions = {}) {
    this.fetchFn = options.fetchFn ?? fetch;
    this.sleepFn = options.sleepFn ?? sleep;
  }

  async getCompanyList(): Promise<ListedCompanyEntry[]> {
    const results: ListedCompanyEntry[] = [];

    for (let pageNo = 1; ; pageNo += 1) {
      if (pageNo > 1) {
        await this.sleepFn(REQUEST_THROTTLE_MS);
      }

      const response = await this.fetchFn(COMPANY_DIRECTORY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: buildCompanyListPayload(pageNo),
      });

      if (!response.ok) {
        throw new Error(
          `PSE Edge company list request failed on page ${pageNo} with status ${response.status}`
        );
      }

      const html = await response.text();

      try {
        const lastPage = extractLastCompanyListPage(html);
        const pageResults = parseCompanyList(html);

        if (pageResults.length === 0) {
          return results;
        }

        results.push(...pageResults);

        if (pageNo >= lastPage) {
          return results;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `PSE Edge company list parsing failed on page ${pageNo}: ${message}`
        );
      }
    }
  }

  async getStockData(edgeCmpyId: string): Promise<StockDetailSnapshot> {
    const response = await this.fetchFn(
      `${STOCK_DATA_URL}?cmpy_id=${encodeURIComponent(edgeCmpyId)}`
    );

    if (!response.ok) {
      throw new Error(
        `PSE Edge stock data request failed for cmpy_id ${edgeCmpyId} with status ${response.status}`
      );
    }

    const html = await response.text();

    try {
      return parseStockData(html, edgeCmpyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `PSE Edge stock data parsing failed for cmpy_id ${edgeCmpyId}: ${message}`
      );
    }
  }

  async getCompanyInfo(edgeCmpyId: string): Promise<CompanyProfile> {
    const response = await this.fetchFn(
      `${COMPANY_INFORMATION_URL}?cmpy_id=${encodeURIComponent(edgeCmpyId)}`
    );

    if (!response.ok) {
      throw new Error(
        `PSE Edge company info request failed for cmpy_id ${edgeCmpyId} with status ${response.status}`
      );
    }

    const html = await response.text();

    try {
      return parseCompanyInfo(html, edgeCmpyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `PSE Edge company info parsing failed for cmpy_id ${edgeCmpyId}: ${message}`
      );
    }
  }

  async getDividends(edgeCmpyId: string): Promise<DividendEntry[]> {
    await this.sleepFn(REQUEST_THROTTLE_MS);

    const formResponse = await this.fetchFn(
      `${DIVIDENDS_FORM_URL}?cmpy_id=${encodeURIComponent(edgeCmpyId)}`
    );

    if (!formResponse.ok) {
      throw new Error(
        `PSE Edge dividends request failed for cmpy_id ${edgeCmpyId} with status ${formResponse.status}`
      );
    }

    const formHtml = await formResponse.text();

    try {
      const formRows = parseDividends(formHtml);

      if (formRows.length > 0) {
        return formRows;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `PSE Edge dividends parsing failed for cmpy_id ${edgeCmpyId}: ${message}`
      );
    }

    const listResponse = await this.fetchFn(
      `${DIVIDENDS_LIST_URL}?DividendsOrRights=Dividends`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: buildDividendsPayload(edgeCmpyId),
      }
    );

    if (!listResponse.ok) {
      throw new Error(
        `PSE Edge dividends request failed for cmpy_id ${edgeCmpyId} with status ${listResponse.status}`
      );
    }

    const listHtml = await listResponse.text();

    try {
      return parseDividends(listHtml);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `PSE Edge dividends parsing failed for cmpy_id ${edgeCmpyId}: ${message}`
      );
    }
  }

  async getHistoricalPrices(
    edgeCmpyId: string,
    edgeSecId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalPricePoint[]> {
    const payload = {
      cmpy_id: edgeCmpyId,
      security_id: edgeSecId,
      startDate: this.parseDate(startDate),
      endDate: this.parseDate(endDate),
    };

    const response = await this.fetchFn(DISCLOSURE_CHART_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `PSE Edge historical prices request failed for cmpy_id ${edgeCmpyId} and security_id ${edgeSecId} with status ${response.status}`
      );
    }

    const data = await response.json();

    try {
      return parseHistoricalPrices(data, edgeCmpyId, edgeSecId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `PSE Edge historical prices parsing failed for cmpy_id ${edgeCmpyId} and security_id ${edgeSecId}: ${message}`
      );
    }
  }

  private parseDate(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString();

    return `${month}-${day}-${year}`;
  }
}
