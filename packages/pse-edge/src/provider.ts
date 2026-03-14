import { parseCompanyList } from "./parsers/company-list";
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
        const pageResults = parseCompanyList(html);

        if (pageResults.length === 0) {
          return results;
        }

        results.push(...pageResults);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`PSE Edge company list parsing failed on page ${pageNo}: ${message}`);
      }
    }
  }

  async getStockData(_edgeCmpyId: string): Promise<StockDetailSnapshot> {
    const response = await this.fetchFn(`${STOCK_DATA_URL}?cmpy_id=${encodeURIComponent(_edgeCmpyId)}`);

    if (!response.ok) {
      throw new Error(`PSE Edge stock data request failed for cmpy_id ${_edgeCmpyId} with status ${response.status}`);
    }

    const html = await response.text();

    try {
      return parseStockData(html, _edgeCmpyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`PSE Edge stock data parsing failed for cmpy_id ${_edgeCmpyId}: ${message}`);
    }
  }

  async getCompanyInfo(_edgeCmpyId: string): Promise<CompanyProfile> {
    const response = await this.fetchFn(
      `${COMPANY_INFORMATION_URL}?cmpy_id=${encodeURIComponent(_edgeCmpyId)}`,
    );

    if (!response.ok) {
      throw new Error(
        `PSE Edge company info request failed for cmpy_id ${_edgeCmpyId} with status ${response.status}`,
      );
    }

    const html = await response.text();

    try {
      return parseCompanyInfo(html, _edgeCmpyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`PSE Edge company info parsing failed for cmpy_id ${_edgeCmpyId}: ${message}`);
    }
  }

  async getHistoricalPrices(
    _edgeCmpyId: string,
    _edgeSecId: string,
    _startDate: string,
    _endDate: string,
  ): Promise<HistoricalPricePoint[]> {
    const response = await this.fetchFn(DISCLOSURE_CHART_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: buildHistoricalPricesPayload(_edgeCmpyId, _edgeSecId, _startDate, _endDate),
    });

    if (!response.ok) {
      throw new Error(
        `PSE Edge historical prices request failed for cmpy_id ${_edgeCmpyId} and security_id ${_edgeSecId} with status ${response.status}`,
      );
    }

    const payload = await response.text();

    try {
      return parseHistoricalPrices(payload, _edgeCmpyId, _edgeSecId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `PSE Edge historical prices parsing failed for cmpy_id ${_edgeCmpyId} and security_id ${_edgeSecId}: ${message}`,
      );
    }
  }
}
