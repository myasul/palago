import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@palago/db/client", () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from "@palago/db/client";

import { getStockPriceHistory, type StockPriceHistoryRow } from "./stock-price-history";

const executeMock = vi.mocked(db.execute);

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

const renderChunk = (value: unknown): string => {
  if (isSqlLike(value)) {
    return value.queryChunks?.map(renderChunk).join("") ?? "";
  }

  if (isStringChunk(value)) {
    return value.value.join("");
  }

  return "?";
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

const toSqlString = (value: unknown): string => {
  return renderChunk(value).replace(/\s+/g, " ").trim();
};

const makeRow = (overrides: Partial<StockPriceHistoryRow> = {}): StockPriceHistoryRow => ({
  tradeDate: "2026-03-20",
  closePrice: "245.5000",
  ...overrides,
});

describe("getStockPriceHistory", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("returns [] when the symbol has no daily_prices rows", async () => {
    executeMock.mockResolvedValueOnce([] as never);

    const result = await getStockPriceHistory({ symbol: "bpi", days: 30 });

    const query = executeMock.mock.calls[0]?.[0];

    expect(result).toEqual([]);
    expect(collectParams(query)).toContain("BPI");
    expect(collectParams(query)).toContain(30);
  });

  it("returns all rows when close_price values are all null", async () => {
    executeMock.mockResolvedValueOnce([
      makeRow({ tradeDate: "2026-03-18", closePrice: null }),
      makeRow({ tradeDate: "2026-03-19", closePrice: null }),
    ] as never);

    const result = await getStockPriceHistory({ symbol: "BPI", days: 30 });

    expect(result).toEqual([
      { tradeDate: "2026-03-18", closePrice: null },
      { tradeDate: "2026-03-19", closePrice: null },
    ]);
  });

  it("returns mixed null and non-null close prices in ascending order without filtering nulls", async () => {
    executeMock.mockResolvedValueOnce([
      makeRow({ tradeDate: "2026-03-17", closePrice: null }),
      makeRow({ tradeDate: "2026-03-18", closePrice: "101.2500" }),
      makeRow({ tradeDate: "2026-03-19", closePrice: null }),
      makeRow({ tradeDate: "2026-03-20", closePrice: "102.5000" }),
    ] as never);

    const result = await getStockPriceHistory({ symbol: "BPI", days: 30 });

    expect(result).toEqual([
      { tradeDate: "2026-03-17", closePrice: null },
      { tradeDate: "2026-03-18", closePrice: "101.2500" },
      { tradeDate: "2026-03-19", closePrice: null },
      { tradeDate: "2026-03-20", closePrice: "102.5000" },
    ]);
  });

  it.each([7, 30, 180, 365] as const)(
    "uses the requested %s-day window in the SQL filter",
    async (days) => {
      executeMock.mockResolvedValueOnce([] as never);

      await getStockPriceHistory({ symbol: "BPI", days });

      const query = executeMock.mock.calls[0]?.[0];

      expect(toSqlString(query)).toContain(
        "WHERE daily_prices.trade_date >= CURRENT_DATE - (? * INTERVAL '1 day')"
      );
      expect(collectParams(query)).toContain(days);
    }
  );

  it("returns a single row within the window correctly", async () => {
    executeMock.mockResolvedValueOnce([
      makeRow({ tradeDate: "2026-03-21", closePrice: "99.7500" }),
    ] as never);

    const result = await getStockPriceHistory({ symbol: "BPI", days: 7 });

    expect(result).toEqual([
      { tradeDate: "2026-03-21", closePrice: "99.7500" },
    ]);
  });
});
