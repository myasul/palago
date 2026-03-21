"use client";

import { useEffect, useState } from "react";

import type {
  StockListOrder,
  StockListSort,
  StockListType,
} from "@/lib/queries/stock-list";
import { StockListControls } from "@/components/stock-list/StockListControls";

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
const STICKY_BAR_HEIGHT_PX = 94;

export function StockListShell(props: StockListShellProps) {
  const [isStickyVisible, setIsStickyVisible] = useState(false);

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

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-b-2xl border border-black/5 border-t-0 bg-white shadow-sm">
        <StockListControls {...props} />
      </div>

      <div aria-hidden="true" style={{ height: isStickyVisible ? STICKY_BAR_HEIGHT_PX : 0 }} />

      {isStickyVisible ? (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-[#f0f0f0] bg-white">
          <div className="mx-auto w-full max-w-xl px-4">
            <div className="flex items-center justify-between px-4 py-[10px]">
              <div className="flex items-center gap-2">
                <span className="h-[7px] w-[7px] rounded-full bg-[#fbbf24]" />
                <span className="text-[13px] font-semibold text-[#111827]">Stock List</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {props.totalCount} stocks · p.{props.page}
              </span>
            </div>

            <div className="px-3 pb-2">
              <StockListControls {...props} compact showSearch={false} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
