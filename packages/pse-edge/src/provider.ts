import { extractLastCompanyListPage, parseCompanyList } from "./parsers/company-list";
import { parseCompanyInfo } from "./parsers/company-info";
import { parseHistoricalPrices } from "./parsers/historical-prices";
import { parseStockData } from "./parsers/stock-data";
import type {
  CompanyProfile,
  HistoricalPricePoint,
  IPSEDataProvider,
  ListedCompanyEntry,
  StockDetailSnapshot,
} from "./types";
import { sleep } from "./utils/sleep";

const COMPANY_DIRECTORY_URL = "https://edge.pse.com.ph/companyDirectory/search.ax";
const COMPANY_INFORMATION_URL = "https://edge.pse.com.ph/companyInformation/form.do";
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

const buildHistoricalPricesPayload = (
  edgeCmpyId: string,
  edgeSecId: string,
  startDate: string,
  endDate: string,
) =>
  new URLSearchParams({
    cmpy_id: edgeCmpyId,
    security_id: edgeSecId,
    startDate,
    endDate,
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
        throw new Error(`PSE Edge company list request failed on page ${pageNo} with status ${response.status}`);
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
        throw new Error(`PSE Edge company list parsing failed on page ${pageNo}: ${message}`);
      }
    }
  }

  async getStockData(edgeCmpyId: string): Promise<StockDetailSnapshot> {
    const response = await this.fetchFn(`${STOCK_DATA_URL}?cmpy_id=${encodeURIComponent(edgeCmpyId)}`);

    if (!response.ok) {
      throw new Error(`PSE Edge stock data request failed for cmpy_id ${edgeCmpyId} with status ${response.status}`);
    }

    const html = await response.text();

    try {
      return parseStockData(html, edgeCmpyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`PSE Edge stock data parsing failed for cmpy_id ${edgeCmpyId}: ${message}`);
    }
  }

  async getCompanyInfo(edgeCmpyId: string): Promise<CompanyProfile> {
    const response = await this.fetchFn(
      `${COMPANY_INFORMATION_URL}?cmpy_id=${encodeURIComponent(edgeCmpyId)}`,
    );

    if (!response.ok) {
      throw new Error(
        `PSE Edge company info request failed for cmpy_id ${edgeCmpyId} with status ${response.status}`,
      );
    }

    const html = await response.text();

    try {
      return parseCompanyInfo(html, edgeCmpyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`PSE Edge company info parsing failed for cmpy_id ${edgeCmpyId}: ${message}`);
    }
  }

  async getHistoricalPrices(
    edgeCmpyId: string,
    edgeSecId: string,
    startDate: string,
    endDate: string,
  ): Promise<HistoricalPricePoint[]> {
    const response = await this.fetchFn(DISCLOSURE_CHART_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: buildHistoricalPricesPayload(edgeCmpyId, edgeSecId, startDate, endDate),
    });

    if (!response.ok) {
      throw new Error(
        `PSE Edge historical prices request failed for cmpy_id ${edgeCmpyId} and security_id ${edgeSecId} with status ${response.status}`,
      );
    }

    const payload = await response.text();

    try {
      return parseHistoricalPrices(payload, edgeCmpyId, edgeSecId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `PSE Edge historical prices parsing failed for cmpy_id ${edgeCmpyId} and security_id ${edgeSecId}: ${message}`,
      );
    }
  }
}
