import { Suspense } from "react";

import { redirect } from "next/navigation";

import { ToastHandler } from "@/components/ToastHandler";
import { ChartSkeleton } from "@/components/stock-detail/ChartSkeleton";
import { StockDetailChartServer } from "@/components/stock-detail/StockDetailChartServer";
import { StockDetailHeader } from "@/components/stock-detail/StockDetailHeader";
import { StockDetailMinInvest } from "@/components/stock-detail/StockDetailMinInvest";
import { StockDetailRange52 } from "@/components/stock-detail/StockDetailRange52";
import { StockDetailTrading } from "@/components/stock-detail/StockDetailTrading";
import { StockDetailSearch } from "@/components/stock-detail/StockDetailSearch";
import { getStockDetail } from "@/lib/queries/stock-detail";

type StockDetailPageProps = {
  params: Promise<{
    symbol: string;
  }>;
  searchParams: Promise<{
    range?: string;
    toast?: string;
  }>;
};

const VALID_RANGES = ["1w", "1m", "6m", "1y"] as const;

export default async function StockDetailPage({
  params,
  searchParams,
}: StockDetailPageProps) {
  const { symbol } = await params;
  const { range, ...otherSearchParams } = await searchParams;
  const normalizedSymbol = symbol.toUpperCase();
  const normalizedRange = VALID_RANGES.includes(
    (range ?? "1m") as (typeof VALID_RANGES)[number]
  )
    ? (range ?? "1m")
    : "1m";

  const result = await getStockDetail({ symbol: normalizedSymbol });

  if (result === null) {
    redirect("/lists/blue-chips?toast=stock-not-found");
  }

  if (result.state.hasPriceData === false && otherSearchParams.toast !== "no-price-data") {
    redirect(`/stocks/${normalizedSymbol}?toast=no-price-data`);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col bg-[#f8fafc] pb-10">
      <StockDetailSearch initialSymbol={normalizedSymbol} />
      <ToastHandler
        param="no-price-data"
        message="Price data isn't available yet for this stock."
      />
      <StockDetailHeader
        companyName={result.stock.companyName}
        lastClose={result.stock.lastClose}
        logoUrl={result.stock.logoUrl}
        percentChange={result.stock.percentChange}
        prevClose={result.stock.prevClose}
        sector={result.stock.sector}
        subsector={result.stock.subsector}
        symbol={result.stock.symbol}
      />
      <StockDetailMinInvest
        boardLot={result.stock.boardLot}
        lastClose={result.stock.lastClose}
        minimumInvestment={result.stock.minimumInvestment}
      />
      <StockDetailTrading
        highPrice={result.stock.highPrice}
        lastClose={result.stock.lastClose}
        lowPrice={result.stock.lowPrice}
        openPrice={result.stock.openPrice}
        percentChange={result.stock.percentChange}
        tradeDate={result.stock.tradeDate}
        value={result.stock.value}
        volume={result.stock.volume}
      />
      <StockDetailRange52
        lastClose={result.stock.lastClose}
        range52={result.range52}
      />
      <Suspense fallback={<ChartSkeleton />}>
        <StockDetailChartServer
          range={normalizedRange}
          symbol={normalizedSymbol}
        />
      </Suspense>
    </main>
  );
}
