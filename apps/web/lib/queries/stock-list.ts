import { sql, type SQL } from "drizzle-orm";

import { db } from "@palago/db/client";

const PAGE_SIZE = 25;

export type StockListType = "blue-chips" | "all";
export type StockListSort = "percent_change" | "price" | "name";
export type StockListOrder = "asc" | "desc";

export type StockListState = {
  type: StockListType;
  sector: string | null;
  search: string | null;
  sort: StockListSort;
  order: StockListOrder;
  page: number;
};

export type StockListEntry = {
  stockId: number;
  symbol: string;
  boardLot: number | null;
  isBlueChip: boolean | null;
  isActive: boolean | null;
  companyId: number | null;
  companyName: string;
  sector: string | null;
  logoUrl: string | null;
  tradeDate: string | null;
  closePrice: string | null;
  percentChange: string | null;
  minimumInvestment: string | null;
};

export type StockListPageResult = {
  stocks: StockListEntry[];
  sectors: string[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  state: StockListState;
};

export type GetStockListPageParams = {
  type: StockListType;
  sector: string | null;
  search: string | null;
  sort: StockListSort;
  order: StockListOrder;
  page: number;
};

type CountRow = {
  count: number;
};

type SectorRow = {
  sector: string;
};

const latestDailyPricesSubquery = sql`
  SELECT DISTINCT ON (stock_id)
    stock_id,
    close_price,
    percent_change,
    trade_date
  FROM daily_prices
  ORDER BY stock_id, trade_date DESC
`;

const buildWhereClause = ({
  type,
  sector,
  search,
}: Pick<GetStockListPageParams, "type" | "sector" | "search">): SQL => {
  const conditions: SQL[] = [sql`stocks.is_active = true`];

  if (type === "blue-chips") {
    conditions.push(sql`stocks.is_blue_chip = true`);
  }

  if (sector !== null) {
    conditions.push(sql`companies.sector = ${sector}`);
  }

  if (search !== null) {
    const searchPattern = `%${search}%`;

    conditions.push(
      sql`(
        stocks.symbol ILIKE ${searchPattern}
        OR companies.name ILIKE ${searchPattern}
      )`
    );
  }

  return sql`WHERE ${sql.join(conditions, sql` AND `)}`;
};

const buildOrderByClause = (
  sort: StockListSort,
  order: StockListOrder
): SQL => {
  const direction = order === "asc" ? "ASC" : "DESC";

  switch (sort) {
    case "price":
      return sql.raw(
        `ORDER BY latest_prices.close_price ${direction} NULLS LAST, companies.name ASC`
      );
    case "name":
      return sql.raw(
        `ORDER BY companies.name ${direction} NULLS LAST, stocks.symbol ASC`
      );
    case "percent_change":
    default:
      return sql.raw(
        `ORDER BY latest_prices.percent_change ${direction} NULLS LAST, companies.name ASC`
      );
  }
};

const normalizeSearch = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const normalizePage = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
};

const toStockListEntry = (row: StockListEntry): StockListEntry => ({
  stockId: row.stockId,
  symbol: row.symbol,
  boardLot: row.boardLot ?? null,
  isBlueChip: row.isBlueChip ?? null,
  isActive: row.isActive ?? null,
  companyId: row.companyId ?? null,
  companyName: row.companyName,
  sector: row.sector ?? null,
  logoUrl: row.logoUrl ?? null,
  tradeDate: row.tradeDate ?? null,
  closePrice: row.closePrice ?? null,
  percentChange: row.percentChange ?? null,
  minimumInvestment: row.minimumInvestment ?? null,
});

export const getStockListPage = async (
  params: GetStockListPageParams
): Promise<StockListPageResult> => {
  const normalizedState = {
    type: params.type,
    sector: params.sector,
    search: normalizeSearch(params.search),
    sort: params.sort,
    order: params.order,
    page: normalizePage(params.page),
  } satisfies StockListState;

  const whereClause = buildWhereClause(normalizedState);
  const orderByClause = buildOrderByClause(
    normalizedState.sort,
    normalizedState.order
  );

  const [sectorResults, countResults] = await Promise.all([
    db.execute<SectorRow>(sql`
      SELECT DISTINCT companies.sector AS "sector"
      FROM companies
      INNER JOIN stocks
        ON stocks.company_id = companies.id
      WHERE stocks.is_active = true
        AND companies.sector IS NOT NULL
      ORDER BY companies.sector ASC
    `),
    db.execute<CountRow>(sql`
      SELECT COUNT(*)::int AS "count"
      FROM stocks
      INNER JOIN companies
        ON stocks.company_id = companies.id
      ${whereClause}
    `),
  ]);

  const totalCount = countResults[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(1, normalizedState.page), totalPages);
  const offset = (clampedPage - 1) * PAGE_SIZE;

  const dbResults = await db.execute<StockListEntry>(sql`
    SELECT
      stocks.id AS "stockId",
      stocks.symbol AS "symbol",
      stocks.board_lot AS "boardLot",
      stocks.is_blue_chip AS "isBlueChip",
      stocks.is_active AS "isActive",
      stocks.company_id AS "companyId",
      companies.name AS "companyName",
      companies.sector AS "sector",
      companies.logo_url AS "logoUrl",
      latest_prices.trade_date::text AS "tradeDate",
      latest_prices.close_price::text AS "closePrice",
      latest_prices.percent_change::text AS "percentChange",
      CASE
        WHEN stocks.board_lot IS NULL OR latest_prices.close_price IS NULL THEN NULL
        ELSE (stocks.board_lot::numeric * latest_prices.close_price)::text
      END AS "minimumInvestment"
    FROM stocks
    INNER JOIN companies
      ON stocks.company_id = companies.id
    LEFT JOIN (${latestDailyPricesSubquery}) AS latest_prices
      ON latest_prices.stock_id = stocks.id
    ${whereClause}
    ${orderByClause}
    LIMIT ${PAGE_SIZE}
    OFFSET ${offset}
  `);
  const stockRows = dbResults.map(toStockListEntry);

  return {
    stocks: stockRows,
    sectors: sectorResults.map((row) => row.sector),
    totalCount,
    page: clampedPage,
    pageSize: PAGE_SIZE,
    totalPages,
    state: {
      ...normalizedState,
      page: clampedPage,
    },
  };
};
