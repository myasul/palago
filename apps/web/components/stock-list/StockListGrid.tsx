import type { StockListEntry } from "@/lib/queries/stock-list";

import { StockCard } from "@/components/stock-list/StockCard";

type StockListGridProps = {
  stocks: StockListEntry[];
};

export function StockListGrid({ stocks }: StockListGridProps) {
  return (
    <div className="rounded-2xl bg-transparent px-3 py-2 pb-[14px]">
      <div className="grid grid-cols-1 gap-3">
        {stocks.map((stock) => (
          <StockCard key={stock.stockId} {...stock} />
        ))}
      </div>
    </div>
  );
}
