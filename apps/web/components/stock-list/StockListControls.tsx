"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  StockListOrder,
  StockListSort,
  StockListType,
} from "@/lib/queries/stock-list";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type StockListControlsProps = {
  type: StockListType;
  sector: string | null;
  search: string | null;
  sort: StockListSort;
  order: StockListOrder;
  page: number;
  sectorOptions: string[];
  onOpenFilters: () => void;
  compact?: boolean;
  showSearch?: boolean;
};

const SEARCH_DEBOUNCE_MS = 300;

const getSortLabel = (sort: StockListSort, order: StockListOrder) => {
  const arrow = order === "desc" ? "↓" : "↑";

  switch (sort) {
    case "price":
      return `Price ${arrow}`;
    case "name":
      return `Name ${arrow}`;
    case "percent_change":
    default:
      return `% Change ${arrow}`;
  }
};

const buildPath = (pathname: string, params: URLSearchParams) => {
  const query = params.toString();

  return query.length > 0 ? `${pathname}?${query}` : pathname;
};

const createChipClassName = (isActive: boolean, compact: boolean) =>
  cn(
    "relative inline-flex shrink-0 items-center rounded-full border transition-colors",
    "text-[12px] leading-none whitespace-nowrap",
    compact ? "px-[10px] py-1" : "px-3 py-[5px]",
    isActive
      ? "border-[#4338ca] bg-[#4338ca] font-medium text-white"
      : "border-transparent bg-[#f3f4f6] text-[#374151]",
  );

const getFiltersLabel = (sector: string | null, sort: StockListSort, order: StockListOrder) => {
  const hasNonDefaultSort = sort !== "percent_change" || order !== "desc";

  if (!sector && !hasNonDefaultSort) {
    return "Filters ▾";
  }

  const parts: string[] = [];

  if (sector) {
    parts.push(sector);
  }

  if (hasNonDefaultSort) {
    parts.push(getSortLabel(sort, order));
  }

  return `${parts.join(" · ")} ▾`;
};

export function StockListControls({
  type,
  sector,
  search,
  sort,
  order,
  page: _page,
  sectorOptions: _sectorOptions,
  onOpenFilters,
  compact = false,
  showSearch = true,
}: StockListControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(search ?? "");

  useEffect(() => {
    setSearchInput(search ?? "");
  }, [search]);

  const updateParams = (updates: {
    type?: StockListType;
    sector?: string | null;
    search?: string | null;
    sort?: StockListSort;
    order?: StockListOrder;
    resetPage?: boolean;
  }) => {
    const nextType = updates.type ?? type;
    const params = new URLSearchParams(searchParams.toString());

    if ("sector" in updates) {
      if (updates.sector) {
        params.set("sector", updates.sector);
      } else {
        params.delete("sector");
      }
    }

    if ("search" in updates) {
      const nextSearch = updates.search?.trim() ?? "";

      if (nextSearch.length > 0) {
        params.set("search", nextSearch);
      } else {
        params.delete("search");
      }
    }

    if ("sort" in updates) {
      if (updates.sort && updates.sort !== "percent_change") {
        params.set("sort", updates.sort);
      } else {
        params.delete("sort");
      }
    }

    if ("order" in updates) {
      if (updates.order && updates.order !== "desc") {
        params.set("order", updates.order);
      } else {
        params.delete("order");
      }
    }

    if (updates.resetPage ?? true) {
      params.delete("page");
    }

    router.push(buildPath(`/lists/${nextType}`, params));
  };

  useEffect(() => {
    if (!showSearch) {
      return;
    }

    const normalizedSearch = searchInput.trim();
    const currentSearch = search?.trim() ?? "";

    if (normalizedSearch === currentSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateParams({
        search: normalizedSearch.length > 0 ? normalizedSearch : null,
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, search, showSearch, searchParams, pathname, type]);

  const hasActiveFilters = sector !== null || sort !== "percent_change" || order !== "desc";
  const filtersLabel = getFiltersLabel(sector, sort, order);

  return (
    <section className={cn("bg-white", compact ? "px-3 py-2" : "px-4 py-4")}>
      {showSearch ? (
        <div className="mb-3">
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search company..."
            aria-label="Search stocks"
            className="h-10 rounded-xl border-[#d8dee9] bg-white text-sm shadow-none placeholder:text-slate-400"
          />
        </div>
      ) : null}

      <div
        className={cn(
          "flex gap-1.5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <button
          type="button"
          className={createChipClassName(type === "blue-chips", compact)}
          onClick={() => {
            if (type === "blue-chips") {
              return;
            }

            updateParams({ type: "blue-chips", resetPage: false });
          }}
        >
          Blue Chips
        </button>

        <button
          type="button"
          className={createChipClassName(type === "all", compact)}
          onClick={() => {
            if (type === "all") {
              return;
            }

            updateParams({ type: "all", resetPage: false });
          }}
        >
          All Stocks
        </button>

        <button
          type="button"
          className={cn(
            createChipClassName(false, compact),
            hasActiveFilters
              ? "max-w-[13rem] border-[#c7d2fe] bg-[#EEF2FF] text-[#4338ca]"
              : "text-[#6b7280]",
          )}
          onClick={onOpenFilters}
        >
          <span className="block max-w-full truncate">{filtersLabel}</span>
        </button>
      </div>
    </section>
  );
}
