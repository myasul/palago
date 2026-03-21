"use client";

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
  sectorOptions: string[];
};

export function StockListShell(props: StockListShellProps) {
  return <StockListControls {...props} />;
}
