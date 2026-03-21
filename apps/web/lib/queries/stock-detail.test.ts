import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@palago/db/client", () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from "@palago/db/client";

import { getStockDetail } from "./stock-detail";

const executeMock = vi.mocked(db.execute);

type StockDetailRowFixture = {
  stockId: number;
  symbol: string;
  stockName: string;
  boardLot: number | null;
  isActive: boolean | null;
  companyId: number | null;
  companyName: string;
  sector: string | null;
  subsector: string | null;
  logoUrl: string | null;
  tradeDate: string | null;
  lastClose: string | null;
  prevClose: string | null;
  openPrice: string | null;
  highPrice: string | null;
  lowPrice: string | null;
  volume: number | null;
  value: string | null;
  percentChange: string | null;
  minimumInvestment: string | null;
  low52: string | null;
  high52: string | null;
  asOfDate: string | null;
};

type SqlLike = {
  queryChunks?: unknown[];
};

const isSqlLike = (value: unknown): value is SqlLike => {
  return typeof value === "object" && value !== null && "queryChunks" in value;
};

const isStringChunk = (value: unknown): value is { value: string[] } => {
  return (
    typeof value === "object"
    && value !== null
    && "value" in value
    && Array.isArray((value as { value?: unknown }).value)
  );
};

const collectParams = (value: unknown, params: unknown[] = []): unknown[] => {
  if (isSqlLike(value)) {
    for (const chunk of value.queryChunks ?? []) {
      collectParams(chunk, params);
    }

    return params;
  }

  if (isStringChunk(value)) {
    return params;
  }

  params.push(value);

  return params;
};

const makeRow = (overrides: Partial<StockDetailRowFixture> = {}): StockDetailRowFixture => ({
  stockId: 86,
  symbol: "JFC",
  stockName: "Jollibee Foods Corporation",
  boardLot: 10,
  isActive: true,
  companyId: 86,
  companyName: "Jollibee Foods Corporation",
  sector: "Industrial",
  subsector: "Restaurants",
  logoUrl: "https://palago-assets.s3.ap-southeast-1.amazonaws.com/logos/JFC.jpg",
  tradeDate: "2026-03-21",
  lastClose: "245.5000",
  prevClose: "242.5000",
  openPrice: "243.0000",
  highPrice: "246.0000",
  lowPrice: "241.5000",
  volume: 1200000,
  value: "294600000.0000",
  percentChange: "1.2371",
  minimumInvestment: "2455.0000",
  low52: "180.0000",
  high52: "275.0000",
  asOfDate: "2026-03-21",
  ...overrides,
});

describe("getStockDetail", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("returns null when the symbol is not found", async () => {
    executeMock.mockResolvedValueOnce([] as never);

    const result = await getStockDetail({ symbol: "MISSING" });

    expect(result).toBeNull();
  });

  it("returns hasPriceData false and null price fields when no daily_prices rows exist", async () => {
    executeMock.mockResolvedValueOnce([
      makeRow({
        tradeDate: null,
        lastClose: null,
        prevClose: null,
        openPrice: null,
        highPrice: null,
        lowPrice: null,
        volume: null,
        value: null,
        percentChange: null,
        minimumInvestment: null,
      }),
    ] as never);

    const result = await getStockDetail({ symbol: "jfc" });

    expect(result).not.toBeNull();
    expect(result?.state.hasPriceData).toBe(false);
    expect(result?.state.toast).toBe("no-price-data");
    expect(result?.stock.lastClose).toBeNull();
    expect(result?.stock.prevClose).toBeNull();
    expect(result?.stock.openPrice).toBeNull();
    expect(result?.stock.highPrice).toBeNull();
    expect(result?.stock.lowPrice).toBeNull();
    expect(result?.stock.value).toBeNull();
    expect(result?.stock.percentChange).toBeNull();
    expect(result?.stock.volume).toBeNull();
  });

  it("returns prevClose null and lastClose populated when only one price row exists", async () => {
    executeMock.mockResolvedValueOnce([
      makeRow({
        prevClose: null,
      }),
    ] as never);

    const result = await getStockDetail({ symbol: "JFC" });

    expect(result?.state.hasPriceData).toBe(true);
    expect(result?.stock.lastClose).toBe("245.5000");
    expect(result?.stock.prevClose).toBeNull();
  });

  it("returns both lastClose and prevClose when two price rows exist", async () => {
    executeMock.mockResolvedValueOnce([makeRow()] as never);

    const result = await getStockDetail({ symbol: "JFC" });

    expect(result?.stock.lastClose).toBe("245.5000");
    expect(result?.stock.prevClose).toBe("242.5000");
  });

  it("returns range52 null when there is no stock_52_week row", async () => {
    executeMock.mockResolvedValueOnce([
      makeRow({
        low52: null,
        high52: null,
        asOfDate: null,
      }),
    ] as never);

    const result = await getStockDetail({ symbol: "JFC" });

    expect(result?.range52).toBeNull();
  });

  it("normalizes lowercase symbols to uppercase before lookup", async () => {
    executeMock.mockResolvedValueOnce([makeRow()] as never);

    await getStockDetail({ symbol: "jfc" });

    const params = collectParams(executeMock.mock.calls[0]?.[0]);

    expect(params).toContain("JFC");
  });

  it("returns minimumInvestment null when lastClose is null", async () => {
    executeMock.mockResolvedValueOnce([
      makeRow({
        tradeDate: null,
        lastClose: null,
        minimumInvestment: null,
      }),
    ] as never);

    const result = await getStockDetail({ symbol: "JFC" });

    expect(result?.stock.minimumInvestment).toBeNull();
  });

  it("returns the SQL-derived minimumInvestment string when boardLot and lastClose exist", async () => {
    executeMock.mockResolvedValueOnce([
      makeRow({
        boardLot: 100,
        lastClose: "19.8000",
        minimumInvestment: "1980.0000",
      }),
    ] as never);

    const result = await getStockDetail({ symbol: "MFC" });

    expect(result?.stock.minimumInvestment).toBe("1980.0000");
  });
});
