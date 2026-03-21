"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  StockListOrder,
  StockListSort,
  StockListType,
} from "@/lib/queries/stock-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StockListControlsProps = {
  type: StockListType;
  sector: string | null;
  search: string | null;
  sort: StockListSort;
  order: StockListOrder;
  page: number;
  sectorOptions: string[];
};

const SEARCH_DEBOUNCE_MS = 300;

const SORT_OPTIONS: Array<{ label: string; value: StockListSort }> = [
  { label: "% Change", value: "percent_change" },
  { label: "Price", value: "price" },
  { label: "Name", value: "name" },
];

const isSameValue = (left: string | null, right: string | null) => left === right;

export function StockListControls({
  type: _type,
  sector,
  search,
  sort,
  order,
  page: _page,
  sectorOptions,
}: StockListControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(search ?? "");

  useEffect(() => {
    setSearchInput(search ?? "");
  }, [search]);

  const updateUrl = (updates: {
    sector?: string | null;
    search?: string | null;
    sort?: StockListSort;
    order?: StockListOrder;
  }) => {
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

    const query = params.toString();

    router.push(query.length > 0 ? `${pathname}?${query}` : pathname);
  };

  useEffect(() => {
    const normalizedSearch = searchInput.trim();
    const currentSearch = search?.trim() ?? "";

    if (normalizedSearch === currentSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateUrl({ search: normalizedSearch.length > 0 ? normalizedSearch : null });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, search, searchParams, pathname]);

  return (
    <section className="rounded-2xl border border-black/5 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={_type === "blue-chips" ? "default" : "outline"}
          className={_type === "blue-chips" ? "bg-[#B8CEFF] text-slate-900 hover:bg-[#B8CEFF]/85" : ""}
          onClick={() => router.push("/lists/blue-chips")}
        >
          Blue Chips
        </Button>
        <Button
          type="button"
          size="sm"
          variant={_type === "all" ? "default" : "outline"}
          className={_type === "all" ? "bg-[#FFF0A0] text-slate-900 hover:bg-[#FFF0A0]/85" : ""}
          onClick={() => router.push("/lists/all")}
        >
          All Stocks
        </Button>

        <div className="min-w-[10rem] flex-1 sm:flex-none">
          <Select
            value={sector ?? "__all__"}
            onValueChange={(value) => {
              const nextSector = value === "__all__" ? null : value;

              if (isSameValue(nextSector, sector)) {
                return;
              }

              updateUrl({ sector: nextSector });
            }}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="All sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All sectors</SelectItem>
              {sectorOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3">
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by symbol or company name"
          aria-label="Search stocks"
          className="bg-white"
        />
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Sort by
          </span>
          <Select
            value={sort}
            onValueChange={(value) => {
              const nextSort = value as StockListSort;

              if (nextSort === sort) {
                return;
              }

              updateUrl({ sort: nextSort });
            }}
          >
            <SelectTrigger className="w-[10rem] bg-white">
              <SelectValue placeholder="Sort field" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            Order
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={order === "asc" ? "default" : "outline"}
              className={order === "asc" ? "bg-[#B8CEFF] text-slate-900 hover:bg-[#B8CEFF]/85" : ""}
              onClick={() => {
                if (order === "asc") {
                  return;
                }

                updateUrl({ order: "asc" });
              }}
            >
              Asc
            </Button>
            <Button
              type="button"
              size="sm"
              variant={order === "desc" ? "default" : "outline"}
              className={order === "desc" ? "bg-[#B8CEFF] text-slate-900 hover:bg-[#B8CEFF]/85" : ""}
              onClick={() => {
                if (order === "desc") {
                  return;
                }

                updateUrl({ order: "desc" });
              }}
            >
              Desc
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
