"use client";

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
  onSelectSort: (sort: StockListSort) => void;
  onSelectOrder: (order: StockListOrder) => void;
  onSelectSector: (sector: string | null, closeSheet: boolean) => void;
  onClearSector: () => void;
};

export function StockListFilterDrawer({
  open,
  onOpenChange,
  sort,
  order,
  sector,
  sectorOptions,
  onSelectSort,
  onSelectOrder,
  onSelectSector,
  onClearSector,
}: StockListFilterDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] rounded-t-[24px] bg-white">
        <div className="mx-auto mt-[10px] h-1 w-9 rounded-full bg-[#d1d5db]" />

        <div className="border-b border-[#f3f4f6] px-4 pb-3 pt-2">
          <DrawerTitle className="text-[14px] font-semibold text-[#111827]">
            Filter & Sort
          </DrawerTitle>
        </div>

        <div className="overflow-y-auto pb-6">
          <div className="px-4 pb-1 pt-3 text-[13px] font-medium text-[#6b7280]">Sort by</div>

          {[
            { label: "% Change", value: "percent_change" as const },
            { label: "Price", value: "price" as const },
            { label: "Name", value: "name" as const },
          ].map((option) => {
            const isActive = sort === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelectSort(option.value)}
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
                onClick={() => onSelectOrder("asc")}
                className={cn(
                  "rounded-full px-[14px] py-[5px] text-[12px]",
                  order === "asc"
                    ? "bg-[#4338ca] font-medium text-white"
                    : "bg-[#f3f4f6] text-[#374151]",
                )}
              >
                Ascending
              </button>
              <button
                type="button"
                onClick={() => onSelectOrder("desc")}
                className={cn(
                  "rounded-full px-[14px] py-[5px] text-[12px]",
                  order === "desc"
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
              onClick={onClearSector}
              className="text-[13px] font-medium text-[#4338ca]"
            >
              Clear
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSelectSector(null, true)}
            className={cn(
              "flex min-h-11 w-full items-center justify-between px-4 text-left text-[15px]",
              sector === null ? "bg-[#f5f7ff] font-medium text-[#4338ca]" : "text-[#374151]",
            )}
          >
            <span>All sectors</span>
            {sector === null ? <Check className="h-[14px] w-[14px] text-[#4338ca]" /> : null}
          </button>

          {sectorOptions.map((option) => {
            const isActive = sector === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => onSelectSector(option, true)}
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
