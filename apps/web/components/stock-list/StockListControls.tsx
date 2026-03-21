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
  compact?: boolean;
  showSearch?: boolean;
};

const SEARCH_DEBOUNCE_MS = 300;

const SORT_SEQUENCE: Array<{ sort: StockListSort; order: StockListOrder }> = [
  { sort: "percent_change", order: "desc" },
  { sort: "percent_change", order: "asc" },
  { sort: "price", order: "desc" },
  { sort: "price", order: "asc" },
  { sort: "name", order: "desc" },
  { sort: "name", order: "asc" },
];

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

const getNextSortState = (sort: StockListSort, order: StockListOrder) => {
  const currentIndex = SORT_SEQUENCE.findIndex(
    (item) => item.sort === sort && item.order === order,
  );

  return SORT_SEQUENCE[(currentIndex + 1) % SORT_SEQUENCE.length] ?? SORT_SEQUENCE[0];
};

const buildPath = (pathname: string, params: URLSearchParams) => {
  const query = params.toString();

  return query.length > 0 ? `${pathname}?${query}` : pathname;
};

const createChipClassName = (isActive: boolean, compact: boolean) =>
  cn(
    "relative inline-flex shrink-0 items-center rounded-full border-0 transition-colors",
    "text-[12px] font-medium leading-none",
    compact ? "px-[10px] py-1" : "px-3 py-[5px]",
    isActive ? "bg-[#4338ca] text-white" : "bg-[#f3f4f6] text-[#374151]",
  );

export function StockListControls({
  type,
  sector,
  search,
  sort,
  order,
  page: _page,
  sectorOptions,
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

    params.delete("page");
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
      updateParams({ search: normalizedSearch.length > 0 ? normalizedSearch : null });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, search, showSearch, searchParams, pathname, type]);

  const sortLabel = getSortLabel(sort, order);

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

            updateParams({ type: "blue-chips" });
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

            updateParams({ type: "all" });
          }}
        >
          All Stocks
        </button>

        <button
          type="button"
          className={createChipClassName(false, compact)}
          onClick={() => {
            const nextSortState = getNextSortState(sort, order);

            updateParams({
              sort: nextSortState.sort,
              order: nextSortState.order,
            });
          }}
        >
          {sortLabel}
        </button>

        <label className={cn(createChipClassName(false, compact), "cursor-pointer")}>
          <span>{sector ?? "All sectors"}</span>
          <span className="ml-1 text-[10px]">▼</span>
          <select
            aria-label="Filter by sector"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={sector ?? "__all__"}
            onChange={(event) => {
              const nextSector = event.target.value === "__all__" ? null : event.target.value;

              if (nextSector === sector) {
                return;
              }

              updateParams({ sector: nextSector });
            }}
          >
            <option value="__all__">All sectors</option>
            {sectorOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
