export interface ListedCompanyEntry {
  symbol: string;
  name: string;
  sector: string | null;
  subsector: string | null;
  listingDate: Date | null;
  edgeCmpyId: string;
  edgeSecId: string;
}

export interface StockDetailSnapshot {
  edgeCmpyId: string;
  edgeSecId: string;
  securitySymbol: string;
  currentPrice: number | null;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  volume: number | null;
  value: number | null;
  percentChange: number | null;
  high52Week: number | null;
  low52Week: number | null;
  boardLot: number | null;
  isin: string | null;
  issueType: string | null;
  outstandingShares: number | null;
  listedShares: number | null;
  issuedShares: number | null;
  freeFloatLevel: number | null;
  parValue: number | null;
  foreignOwnershipLimit: number | null;
  listingDate: Date | null;
}

export interface CompanyProfile {
  edgeCmpyId: string;
  description: string | null;
  sector: string | null;
  subsector: string | null;
  incorporationDate: Date | null;
  fiscalYearEnd: string | null;
  externalAuditor: string | null;
  transferAgent: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
}

export interface DividendEntry {
  securityType: string;
  dividendType: string;
  dividendRate: number | null;
  exDate: Date | null;
  recordDate: Date | null;
  paymentDate: Date | null;
}

export interface HistoricalPricePoint {
  edgeCmpyId: string;
  edgeSecId: string;
  tradeDate: Date;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  closePrice: number | null;
  value: number | null;
  volume: null;
}

export interface IPSEDataProvider {
  getCompanyList(): Promise<ListedCompanyEntry[]>;
  getStockData(edgeCmpyId: string): Promise<StockDetailSnapshot>;
  getCompanyInfo(edgeCmpyId: string): Promise<CompanyProfile>;
  getHistoricalPrices(
    edgeCmpyId: string,
    edgeSecId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<HistoricalPricePoint[]>;
}
