"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type {
  StockListOrder,
  StockListSort,
  StockListType,
} from "@/lib/queries/stock-list";
import { StockListControls } from "@/components/stock-list/StockListControls";
import { StockListFilterDrawer } from "@/components/stock-list/StockListFilterDrawer";

type StockListShellProps = {
  type: StockListType;
  sector: string | null;
  search: string | null;
  sort: StockListSort;
  order: StockListOrder;
  page: number;
  totalCount: number;
  sectorOptions: string[];
};

const STICKY_THRESHOLD_PX = 120;
const STICKY_BAR_COLLAPSED_HEIGHT_PX = 46;
const STICKY_BAR_EXPANDED_HEIGHT_PX = 90;

export function StockListShell(props: StockListShellProps) {
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [stickySearchInput, setStickySearchInput] = useState(props.search ?? "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const stickySearchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setStickySearchInput(props.search ?? "");
  }, [props.search]);

  useEffect(() => {
    const onScroll = () => {
      setIsStickyVisible(window.scrollY > STICKY_THRESHOLD_PX);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const updateParams = (updates: {
    type?: StockListType;
    sort?: StockListSort;
    order?: StockListOrder;
    sector?: string | null;
    search?: string | null;
    resetPage?: boolean;
  }) => {
    const nextType = updates.type ?? props.type;
    const params = new URLSearchParams(searchParams.toString());

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

    if ("sector" in updates) {
      if (updates.sector) {
        params.set("sector", updates.sector);
      } else {
        params.delete("sector");
      }
    }

    if (updates.resetPage ?? true) {
      params.delete("page");
    }

    const query = params.toString();
    const path = query.length > 0 ? `/lists/${nextType}?${query}` : `/lists/${nextType}`;

    startTransition(() => {
      router.push(path);
    });
  };

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    stickySearchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const normalizedSearch = stickySearchInput.trim();
    const currentSearch = props.search?.trim() ?? "";

    if (normalizedSearch === currentSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateParams({
        search: normalizedSearch.length > 0 ? normalizedSearch : null,
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchOpen, stickySearchInput, props.search, searchParams, props.type]);

  const stickyBarHeight = searchOpen
    ? STICKY_BAR_EXPANDED_HEIGHT_PX
    : STICKY_BAR_COLLAPSED_HEIGHT_PX;
  const activeStickyChipLabel = props.sector
    ? props.sector
    : props.type === "blue-chips"
      ? "Blue Chips"
      : "All Stocks";

  return (
    <div className="relative">
      <div
        className={[
          "[&_section]:bg-transparent",
          "[&_section]:px-0",
          "[&_section]:py-0",
          "[&_div.mb-3]:mb-[10px]",
          "[&_input]:h-11",
          "[&_input]:rounded-[10px]",
          "[&_input]:border-[rgba(255,255,255,0.9)]",
          "[&_input]:bg-[rgba(255,255,255,0.7)]",
          "[&_input]:px-3",
          "[&_input]:text-[13px]",
          "[&_input]:text-[#78350f]",
          "[&_input]:shadow-none",
          "[&_input]:placeholder:text-[#78350f]/60",
          "[&_input]:focus-visible:ring-[#4338ca]",
          "[&_button]:transition-colors",
        ].join(" ")}
      >
        <StockListControls {...props} onOpenFilters={() => setFiltersOpen(true)} />
      </div>

      <div aria-hidden="true" style={{ height: isStickyVisible ? stickyBarHeight : 0 }} />

      {isStickyVisible ? (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-[#fbbf24] bg-[linear-gradient(160deg,_#fde68a_0%,_#fef3c7_60%)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="mx-auto w-full max-w-xl px-4">
            <div className="px-[14px] py-2">
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-[6px]">
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-[#92400e]">
                    STOCK LIST
                  </span>
                  <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#f59e0b]" />
                  <span className="inline-flex shrink-0 items-center rounded-full bg-[#4338ca] px-[10px] py-[3px] text-[11px] font-medium leading-none text-white">
                    {activeStickyChipLabel}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-[6px]">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen((current) => !current);
                    }}
                    className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.7)] text-[#92400e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2"
                    aria-label={searchOpen ? "Close search" : "Open search"}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle
                        cx="7"
                        cy="7"
                        r="4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M10.5 10.5L14 14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltersOpen(true)}
                    className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.7)] text-[#92400e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2"
                    aria-label="Open filters"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M3 4H13M5 8H11M7 12H9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {searchOpen ? (
                <div className="mt-[6px]">
                  <input
                    ref={stickySearchRef}
                    type="search"
                    value={stickySearchInput}
                    onChange={(event) => setStickySearchInput(event.target.value)}
                    onBlur={() => setSearchOpen(false)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setSearchOpen(false);
                      }
                    }}
                    placeholder="Search company…"
                    aria-label="Search stocks"
                    className="h-[36px] w-full rounded-[8px] border border-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.7)] px-[10px] text-[13px] text-[#78350f] placeholder:text-[#78350f]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <StockListFilterDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        sort={props.sort}
        order={props.order}
        sector={props.sector}
        sectorOptions={props.sectorOptions}
        onApply={({ sort, order, sector }) => {
          updateParams({ sort, order, sector });
        }}
      />
    </div>
  );
}
