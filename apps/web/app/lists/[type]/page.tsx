import { redirect } from "next/navigation";

import {
  getStockListPage,
  type StockListOrder,
  type StockListPageResult,
  type StockListSort,
  type StockListState,
  type StockListType,
} from "@/lib/queries/stock-list";
import { EmptyState } from "@/components/stock-list/EmptyState";
import { Pagination } from "@/components/stock-list/Pagination";
import { StockListGrid } from "@/components/stock-list/StockListGrid";

const DEFAULT_SORT: StockListSort = "percent_change";
const DEFAULT_ORDER: StockListOrder = "desc";
const DEFAULT_PAGE = 1;

type StockListPageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{
    sector?: string;
    sort?: string;
    order?: string;
    search?: string;
    page?: string;
  }>;
};

const isStockListType = (value: string): value is StockListType => {
  return value === "blue-chips" || value === "all";
};

const isStockListSort = (value: string): value is StockListSort => {
  return value === "percent_change" || value === "price" || value === "name";
};

const isStockListOrder = (value: string): value is StockListOrder => {
  return value === "asc" || value === "desc";
};

const parsePage = (value: string | undefined): number => {
  if (value === undefined) {
    return DEFAULT_PAGE;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_PAGE;
  }

  return parsed;
};

const normalizeSearch = (value: string | undefined): string => {
  return value?.trim() ?? "";
};

const normalizeSector = (value: string | undefined): string | null => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
};

function StockListShell({
  state,
  sectors,
}: {
  state: StockListState;
  sectors: string[];
}) {
  return (
    <section
      aria-label="Current stock list filters"
      className="rounded-2xl border border-black/5 bg-white/80 p-4"
    >
      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-full bg-[#B8CEFF]/55 px-2 py-1 font-medium text-slate-800">
          {state.type === "blue-chips" ? "Blue Chips" : "All Stocks"}
        </span>
        <span>Search: {state.search || "All companies"}</span>
        <span>Sector: {state.sector || "All sectors"}</span>
        <span>Sort: {state.sort.replace("_", " ")} • {state.order}</span>
        <span>{sectors.length} sectors</span>
      </div>
    </section>
  );
}

export default async function StockListPage({
  params,
  searchParams,
}: StockListPageProps) {
  const { type } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isStockListType(type)) {
    redirect("/lists/blue-chips");
  }

  const rawSort = resolvedSearchParams.sort;
  const rawOrder = resolvedSearchParams.order;
  const sort: StockListSort =
    rawSort !== undefined && isStockListSort(rawSort) ? rawSort : DEFAULT_SORT;
  const order: StockListOrder =
    rawOrder !== undefined && isStockListOrder(rawOrder) ? rawOrder : DEFAULT_ORDER;
  const page = parsePage(resolvedSearchParams.page);
  const search = normalizeSearch(resolvedSearchParams.search);
  const sector = normalizeSector(resolvedSearchParams.sector);

  const result: StockListPageResult = await getStockListPage({
    type,
    sector,
    search,
    sort,
    order,
    page,
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Stock List
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {type === "blue-chips" ? "Blue-chip stocks" : "All active PSE stocks"}
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Browse PSE-listed stocks from the database only. No runtime calls to PSE Edge
          or any external provider are made on this page.
        </p>
      </header>

      <StockListShell state={result.state} sectors={result.sectors} />

      <section className="space-y-4" aria-label="Stock results">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span>{result.totalCount} stocks</span>
          <span>
            Page {result.page} of {result.totalPages}
          </span>
        </div>
        {result.stocks.length > 0 ? <StockListGrid stocks={result.stocks} /> : <EmptyState />}
        <Pagination state={result.state} totalPages={result.totalPages} />
      </section>
    </main>
  );
}
