import { redirect } from "next/navigation";

import {
  getStockListPage,
  type StockListEntry,
  type StockListOrder,
  type StockListPageResult,
  type StockListSort,
  type StockListState,
  type StockListType,
} from "@/lib/queries/stock-list";

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
        <span>Type: {state.type}</span>
        <span>Sort: {state.sort}</span>
        <span>Order: {state.order}</span>
        <span>Page: {state.page}</span>
        <span>Search: {state.search || "—"}</span>
        <span>Sector: {state.sector || "All sectors"}</span>
        <span>Sectors loaded: {sectors.length}</span>
      </div>
    </section>
  );
}

function StockListGrid({ stocks }: { stocks: StockListEntry[] }) {
  if (stocks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        No stocks match the current filters yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stocks.map((stock) => (
        <article
          key={stock.stockId}
          className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
        >
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            {stock.symbol}
          </div>
          <h2 className="mt-2 text-base font-semibold text-slate-900">
            {stock.companyName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{stock.sector ?? "No sector"}</p>
          <dl className="mt-4 space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between gap-4">
              <dt>Close price</dt>
              <dd>{stock.closePrice ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Percent change</dt>
              <dd>{stock.percentChange ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Minimum investment</dt>
              <dd>{stock.minimumInvestment ?? "—"}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
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

  const sort = isStockListSort(resolvedSearchParams.sort ?? "")
    ? resolvedSearchParams.sort
    : DEFAULT_SORT;
  const order = isStockListOrder(resolvedSearchParams.order ?? "")
    ? resolvedSearchParams.order
    : DEFAULT_ORDER;
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
        <StockListGrid stocks={result.stocks} />
      </section>
    </main>
  );
}
