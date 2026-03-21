import type { StockListEntry } from "@/lib/queries/stock-list";

import { StockCard } from "@/components/stock-list/StockCard";

type StockListGridProps = {
  stocks: StockListEntry[];
};

export function StockListGrid({ stocks }: StockListGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {stocks.map((stock) => (
        <StockCard key={stock.stockId} {...stock} />
      ))}
    </div>
  );
}
