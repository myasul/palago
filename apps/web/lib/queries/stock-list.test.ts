import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@palago/db/client", () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from "@palago/db/client";

import { getStockListPage, type StockListEntry } from "./stock-list";

const executeMock = vi.mocked(db.execute);

const mockExecuteValue = (value: unknown) => {
  executeMock.mockResolvedValueOnce(value as never);
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

const makeStockRow = (overrides: Partial<StockListEntry> = {}): StockListEntry => ({
  stockId: 1,
  symbol: "JFC",
  boardLot: 10,
  isBlueChip: true,
  isActive: true,
  companyId: 86,
  companyName: "Jollibee Foods Corporation",
  sector: "Industrial",
  logoUrl: "https://palago-assets.s3.ap-southeast-1.amazonaws.com/logos/JFC.jpg",
  tradeDate: "2026-03-21",
  closePrice: "245.5000",
  percentChange: "1.2500",
  minimumInvestment: "2455.0000",
  ...overrides,
});

describe("getStockListPage", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("applies the blue-chip filter", async () => {
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 1 }]);
    mockExecuteValue([makeStockRow()]);

    const result = await getStockListPage({
      type: "blue-chips",
      sector: null,
      search: null,
      sort: "percent_change",
      order: "desc",
      page: 1,
    });

    const countQuery = toSqlString(executeMock.mock.calls[1]?.[0]);
    const dataQuery = toSqlString(executeMock.mock.calls[2]?.[0]);

    expect(countQuery).toContain("stocks.is_active = true");
    expect(countQuery).toContain("stocks.is_blue_chip = true");
    expect(dataQuery).toContain("stocks.is_blue_chip = true");
    expect(result.stocks).toHaveLength(1);
    expect(result.stocks[0]?.isBlueChip).toBe(true);
  });

  it("applies the all filter with active stocks only", async () => {
    mockExecuteValue([{ sector: "Financials" }]);
    mockExecuteValue([{ count: 2 }]);
    mockExecuteValue([
      makeStockRow({ stockId: 1, symbol: "BDO", isBlueChip: false, sector: "Financials" }),
      makeStockRow({ stockId: 2, symbol: "JFC", isBlueChip: true }),
    ]);

    const result = await getStockListPage({
      type: "all",
      sector: null,
      search: null,
      sort: "percent_change",
      order: "desc",
      page: 1,
    });

    const countQuery = toSqlString(executeMock.mock.calls[1]?.[0]);

    expect(countQuery).toContain("stocks.is_active = true");
    expect(countQuery).not.toContain("stocks.is_blue_chip = true");
    expect(result.stocks).toHaveLength(2);
  });

  it("filters by exact sector on companies.sector", async () => {
    mockExecuteValue([{ sector: "Financials" }]);
    mockExecuteValue([{ count: 1 }]);
    mockExecuteValue([makeStockRow({ sector: "Financials", symbol: "BDO" })]);

    await getStockListPage({
      type: "all",
      sector: "Financials",
      search: null,
      sort: "name",
      order: "asc",
      page: 1,
    });

    const dataQuery = executeMock.mock.calls[2]?.[0];

    expect(toSqlString(dataQuery)).toContain("companies.sector = ?");
    expect(collectParams(dataQuery)).toContain("Financials");
  });

  it("applies case-insensitive search to symbol and company name", async () => {
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 1 }]);
    mockExecuteValue([makeStockRow()]);

    await getStockListPage({
      type: "all",
      sector: null,
      search: "jFc",
      sort: "name",
      order: "asc",
      page: 1,
    });

    const dataQuery = executeMock.mock.calls[2]?.[0];
    const params = collectParams(dataQuery);

    expect(toSqlString(dataQuery)).toContain("stocks.symbol ILIKE ?");
    expect(toSqlString(dataQuery)).toContain("companies.name ILIKE ?");
    expect(params).toContain("%jFc%");
  });

  it.each([
    ["percent_change", "asc", "ORDER BY latest_prices.percent_change ASC NULLS LAST"],
    ["percent_change", "desc", "ORDER BY latest_prices.percent_change DESC NULLS LAST"],
    ["price", "asc", "ORDER BY latest_prices.close_price ASC NULLS LAST"],
    ["price", "desc", "ORDER BY latest_prices.close_price DESC NULLS LAST"],
    ["name", "asc", "ORDER BY companies.name ASC NULLS LAST"],
    ["name", "desc", "ORDER BY companies.name DESC NULLS LAST"],
  ] as const)("sorts by %s %s with NULLS LAST", async (sort, order, expectedOrderBy) => {
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 1 }]);
    mockExecuteValue([makeStockRow()]);

    await getStockListPage({
      type: "all",
      sector: null,
      search: null,
      sort,
      order,
      page: 1,
    });

    const dataQuery = toSqlString(executeMock.mock.calls[2]?.[0]);

    expect(dataQuery).toContain(expectedOrderBy);
  });

  it("keeps null values last regardless of sort direction", async () => {
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 2 }]);
    mockExecuteValue([
      makeStockRow({ stockId: 1, symbol: "AAA", closePrice: "100.0000", percentChange: "2.0000" }),
      makeStockRow({ stockId: 2, symbol: "BBB", closePrice: null, percentChange: null }),
    ]);
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 2 }]);
    mockExecuteValue([
      makeStockRow({ stockId: 1, symbol: "AAA", closePrice: "100.0000", percentChange: "2.0000" }),
      makeStockRow({ stockId: 2, symbol: "BBB", closePrice: null, percentChange: null }),
    ]);

    await getStockListPage({
      type: "all",
      sector: null,
      search: null,
      sort: "price",
      order: "asc",
      page: 1,
    });

    await getStockListPage({
      type: "all",
      sector: null,
      search: null,
      sort: "price",
      order: "desc",
      page: 1,
    });

    expect(toSqlString(executeMock.mock.calls[2]?.[0])).toContain("NULLS LAST");
    expect(toSqlString(executeMock.mock.calls[5]?.[0])).toContain("NULLS LAST");
  });

  it("returns page 1 with offset 0", async () => {
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 60 }]);
    mockExecuteValue(new Array(25).fill(null).map((_, index) => makeStockRow({
        stockId: index + 1,
        symbol: `SYM${index + 1}`,
      })));

    const result = await getStockListPage({
      type: "all",
      sector: null,
      search: null,
      sort: "name",
      order: "asc",
      page: 1,
    });

    const params = collectParams(executeMock.mock.calls[2]?.[0]);

    expect(params.slice(-2)).toEqual([25, 0]);
    expect(result.page).toBe(1);
    expect(result.stocks).toHaveLength(25);
  });

  it("returns page 2 with the correct offset", async () => {
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 60 }]);
    mockExecuteValue([makeStockRow({ stockId: 26, symbol: "SYM26" })]);

    const result = await getStockListPage({
      type: "all",
      sector: null,
      search: null,
      sort: "name",
      order: "asc",
      page: 2,
    });

    const params = collectParams(executeMock.mock.calls[2]?.[0]);

    expect(params.slice(-2)).toEqual([25, 25]);
    expect(result.page).toBe(2);
  });

  it("clamps out-of-range pages to the last valid page", async () => {
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 30 }]);
    mockExecuteValue([makeStockRow({ stockId: 26, symbol: "LAST" })]);

    const result = await getStockListPage({
      type: "all",
      sector: null,
      search: null,
      sort: "name",
      order: "asc",
      page: 999,
    });

    const params = collectParams(executeMock.mock.calls[2]?.[0]);

    expect(params.slice(-2)).toEqual([25, 25]);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.state.page).toBe(2);
  });

  it("keeps stocks with no daily_prices row and null price fields", async () => {
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 1 }]);
    mockExecuteValue([
      makeStockRow({
        tradeDate: null,
        closePrice: null,
        percentChange: null,
        minimumInvestment: null,
      }),
    ]);

    const result = await getStockListPage({
      type: "all",
      sector: null,
      search: null,
      sort: "percent_change",
      order: "desc",
      page: 1,
    });

    expect(result.stocks[0]).toMatchObject({
      tradeDate: null,
      closePrice: null,
      percentChange: null,
      minimumInvestment: null,
    });
  });

  it("returns minimumInvestment as null when closePrice is null", async () => {
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 1 }]);
    mockExecuteValue([
      makeStockRow({
        closePrice: null,
        minimumInvestment: null,
      }),
    ]);

    const result = await getStockListPage({
      type: "all",
      sector: null,
      search: null,
      sort: "price",
      order: "asc",
      page: 1,
    });

    expect(result.stocks[0]?.minimumInvestment).toBeNull();
  });

  it("returns minimumInvestment as a numeric string when boardLot and closePrice exist", async () => {
    mockExecuteValue([{ sector: "Industrial" }]);
    mockExecuteValue([{ count: 1 }]);
    mockExecuteValue([
      makeStockRow({
        boardLot: 100,
        closePrice: "12.3400",
        minimumInvestment: "1234.0000",
      }),
    ]);

    const result = await getStockListPage({
      type: "all",
      sector: null,
      search: null,
      sort: "price",
      order: "asc",
      page: 1,
    });

    expect(result.stocks[0]?.minimumInvestment).toBe("1234.0000");
  });
});
