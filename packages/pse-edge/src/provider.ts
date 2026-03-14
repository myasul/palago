import { parseCompanyList } from "./parsers/company-list";
import type {
  CompanyProfile,
  HistoricalPricePoint,
  IPSEDataProvider,
  ListedCompanyEntry,
  StockDetailSnapshot,
} from "./types";
import { sleep } from "./utils/sleep";

const COMPANY_DIRECTORY_URL = "https://edge.pse.com.ph/companyDirectory/search.ax";
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
    throw new Error("getStockData is not implemented yet");
  }

  async getCompanyInfo(_edgeCmpyId: string): Promise<CompanyProfile> {
    throw new Error("getCompanyInfo is not implemented yet");
  }

  async getHistoricalPrices(
    _edgeCmpyId: string,
    _edgeSecId: string,
    _startDate: string,
    _endDate: string,
  ): Promise<HistoricalPricePoint[]> {
    throw new Error("getHistoricalPrices is not implemented yet");
  }
}
