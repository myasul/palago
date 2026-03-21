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
import { ToastHandler } from "@/components/ToastHandler";

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

const buildStockListHref = ({
  type,
  sector,
  search,
  sort,
  order,
  page,
}: {
  type: StockListType;
  sector: string | null;
  search: string | null;
  sort: StockListSort;
  order: StockListOrder;
  page: number;
}) => {
  const params = new URLSearchParams();

  if (sector) {
    params.set("sector", sector);
  }

  if (sort !== DEFAULT_SORT) {
    params.set("sort", sort);
  }

  if (order !== DEFAULT_ORDER) {
    params.set("order", order);
  }

  if (search) {
    params.set("search", search);
  }

  if (page > DEFAULT_PAGE) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query.length > 0 ? `/lists/${type}?${query}` : `/lists/${type}`;
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

  const requestedHref = buildStockListHref({
    type,
    sector,
    search: search.length > 0 ? search : null,
    sort,
    order,
    page,
  });
  const canonicalHref = buildStockListHref(result.state);

  if (requestedHref !== canonicalHref) {
    redirect(canonicalHref);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      <ToastHandler param="stock-not-found" message="We couldn't find that stock." />
      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <header className="bg-[linear-gradient(160deg,_#fde68a_0%,_#fef3c7_60%)] px-4 pb-5 pt-[18px]">
          <p className="text-[22px] font-bold tracking-[-0.03em] leading-none text-[#78350f]">
            STOCK LIST
          </p>
          <p className="mt-2 max-w-[18rem] text-[13px] leading-5 text-[#92400e]">
            Browse PSE-listed companies by affordability, sector, and momentum.
          </p>
          <div className="mt-[10px] flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium text-[#78350f]">
              {result.totalCount} stocks · Page {result.page} of {result.totalPages}
            </p>
            <div className="flex shrink-0 items-center gap-1 text-[11px] text-[#92400e]">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="#92400e" strokeWidth="1.5" />
                <path
                  d="M8 7v4M8 5.5v.5"
                  stroke="#92400e"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>Data delayed 15 min</span>
            </div>
          </div>
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
        {result.stocks.length > 0 ? <StockListGrid stocks={result.stocks} /> : <EmptyState />}
        <Pagination state={result.state} totalPages={result.totalPages} />
      </section>
    </main>
  );
}
