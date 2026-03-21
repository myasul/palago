import { redirect } from "next/navigation";

import {
  getStockListPage,
  type StockListOrder,
  type StockListPageResult,
  type StockListSort,
  type StockListType,
} from "@/lib/queries/stock-list";
import { EmptyState } from "@/components/stock-list/EmptyState";
import { Pagination } from "@/components/stock-list/Pagination";
import { StockListGrid } from "@/components/stock-list/StockListGrid";
import { StockListShell } from "@/components/stock-list/StockListShell";

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

  const titleLines =
    type === "blue-chips"
      ? ["Blue-chip", "stocks"]
      : ["All", "stocks"];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <header className="bg-[linear-gradient(160deg,_#fde68a_0%,_#fef3c7_60%)] px-4 pb-5 pt-[18px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#92400e]">
            STOCK LIST
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-0.03em] leading-[1.15] text-slate-950">
            <span className="block">{titleLines[0]}</span>
            <span className="block">{titleLines[1]}</span>
          </h1>
          <p className="mt-3 text-[12px] text-[#78350f]">
            {result.totalCount} stocks · Page {result.page} of {result.totalPages}
          </p>
        </header>

        <StockListShell
          type={result.state.type}
          sector={result.state.sector}
          search={result.state.search}
          sort={result.state.sort}
          order={result.state.order}
          page={result.state.page}
          totalCount={result.totalCount}
          sectorOptions={result.sectors}
        />
      </section>

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
