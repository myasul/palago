"use client";

import { useEffect, useState } from "react";

import { Check } from "lucide-react";

import type { StockListOrder, StockListSort } from "@/lib/queries/stock-list";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

type StockListFilterDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: StockListSort;
  order: StockListOrder;
  sector: string | null;
  sectorOptions: string[];
  onApply: (draft: {
    sort: StockListSort;
    order: StockListOrder;
    sector: string | null;
  }) => void;
};

export function StockListFilterDrawer({
  open,
  onOpenChange,
  sort,
  order,
  sector,
  sectorOptions,
  onApply,
}: StockListFilterDrawerProps) {
  const [draftSort, setDraftSort] = useState(sort);
  const [draftOrder, setDraftOrder] = useState(order);
  const [draftSector, setDraftSector] = useState(sector);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraftSort(sort);
    setDraftOrder(order);
    setDraftSector(sector);
  }, [open, sort, order, sector]);

  const hasChanges = draftSort !== sort || draftOrder !== order || draftSector !== sector;

  const commitDraft = () => {
    if (!hasChanges) {
      return;
    }

    onApply({
      sort: draftSort,
      order: draftOrder,
      sector: draftSector,
    });
  };

  const handleApply = () => {
    commitDraft();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      commitDraft();
    }

    onOpenChange(nextOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[85vh] rounded-t-[24px] bg-white">
        <div className="mx-auto mt-[10px] h-1 w-9 rounded-full bg-[#d1d5db]" />

        <div className="border-b border-[#f3f4f6] px-4 pb-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <DrawerTitle className="text-[14px] font-semibold text-[#111827]">
              Filter & Sort
            </DrawerTitle>
            <button
              type="button"
              onClick={handleApply}
              disabled={!hasChanges}
              className={cn(
                "rounded-full px-3 py-[6px] text-[12px] font-semibold transition-colors",
                hasChanges
                  ? "bg-[#4338ca] text-white"
                  : "bg-[#eef2f7] text-[#9ca3af]",
              )}
            >
              Apply
            </button>
          </div>
        </div>

        <div className="overflow-y-auto pb-6">
          <div className="px-4 pb-1 pt-3 text-[13px] font-medium text-[#6b7280]">Sort by</div>

          {[
            { label: "% Change", value: "percent_change" as const },
            { label: "Price", value: "price" as const },
            { label: "Name", value: "name" as const },
          ].map((option) => {
            const isActive = draftSort === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDraftSort(option.value)}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between px-4 text-left text-[15px]",
                  isActive ? "bg-[#f5f7ff] font-medium text-[#4338ca]" : "text-[#374151]",
                )}
              >
                <span>{option.label}</span>
                {isActive ? <Check className="h-[14px] w-[14px] text-[#4338ca]" /> : null}
              </button>
            );
          })}

          <div className="px-4 pb-1 pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraftOrder("asc")}
                className={cn(
                  "rounded-full px-[14px] py-[5px] text-[12px]",
                  draftOrder === "asc"
                    ? "bg-[#4338ca] font-medium text-white"
                    : "bg-[#f3f4f6] text-[#374151]",
                )}
              >
                Ascending
              </button>
              <button
                type="button"
                onClick={() => setDraftOrder("desc")}
                className={cn(
                  "rounded-full px-[14px] py-[5px] text-[12px]",
                  draftOrder === "desc"
                    ? "bg-[#4338ca] font-medium text-white"
                    : "bg-[#f3f4f6] text-[#374151]",
                )}
              >
                Descending
              </button>
            </div>
          </div>

          <div className="my-2 border-t border-[#f3f4f6]" />

          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <span className="text-[13px] font-medium text-[#6b7280]">Sector</span>
            <button
              type="button"
              onClick={() => setDraftSector(null)}
              className="text-[13px] font-medium text-[#4338ca]"
            >
              Clear
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDraftSector(null)}
            className={cn(
              "flex min-h-11 w-full items-center justify-between px-4 text-left text-[15px]",
              draftSector === null ? "bg-[#f5f7ff] font-medium text-[#4338ca]" : "text-[#374151]",
            )}
          >
            <span>All sectors</span>
            {draftSector === null ? <Check className="h-[14px] w-[14px] text-[#4338ca]" /> : null}
          </button>

          {sectorOptions.map((option) => {
            const isActive = draftSector === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setDraftSector(option)}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between px-4 text-left text-[15px]",
                  isActive ? "bg-[#f5f7ff] font-medium text-[#4338ca]" : "text-[#374151]",
                )}
              >
                <span>{option}</span>
                {isActive ? <Check className="h-[14px] w-[14px] text-[#4338ca]" /> : null}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
