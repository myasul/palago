import type { IngestionLog, MarketIndex } from "./market";
import type { DailyPrice, Dividend, IntradaySnapshot, Stock } from "./stock";

export type MarketStatus = "open" | "closed" | "pre-open" | "holiday";
export type ListType = "top-gainers" | "top-losers" | "most-active" | "blue-chips";

export interface StockListItem {
  rank: number;
  symbol: Stock["symbol"];
  name: Stock["name"];
  sector: string | null;
  price: DailyPrice["closePrice"] | IntradaySnapshot["currentPrice"] | null;
  changePercent: DailyPrice["percentChange"] | IntradaySnapshot["percentChange"] | null;
  volume: DailyPrice["volume"] | IntradaySnapshot["volume"] | null;
}

export interface DashboardResponse {
  pseIndex: MarketIndex | null;
  sectorPerformance: MarketIndex[];
  topGainers: StockListItem[];
  topLosers: StockListItem[];
  mostActive: StockListItem[];
  blueChips: StockListItem[];
  lastUpdated: string | null;
  marketStatus: MarketStatus;
}

export interface FiftyTwoWeekRange {
  high52w: DailyPrice["highPrice"] | null;
  low52w: DailyPrice["lowPrice"] | null;
  asOfDate: DailyPrice["tradeDate"] | null;
}

export interface StockDetailResponse {
  company: Stock;
  latestPrice: IntradaySnapshot | DailyPrice | null;
  ohlc: Pick<DailyPrice, "openPrice" | "highPrice" | "lowPrice" | "closePrice" | "tradeDate"> | null;
  volume: DailyPrice["volume"] | IntradaySnapshot["volume"] | null;
  marketCap: string | null;
  fiftyTwoWeekRange: FiftyTwoWeekRange;
  dividends: Dividend[];
  chart: DailyPrice[];
}

export interface ListResponse {
  type: ListType;
  page: number;
  pageSize: number;
  totalCount: number;
  sector: string | null;
  items: StockListItem[];
}

export interface JobStatusResponse {
  job: IngestionLog;
}
