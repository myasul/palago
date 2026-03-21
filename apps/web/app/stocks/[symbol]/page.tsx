import { redirect } from "next/navigation";

import { ToastHandler } from "@/components/ToastHandler";
import { StockDetailHeader } from "@/components/stock-detail/StockDetailHeader";
import { StockDetailMinInvest } from "@/components/stock-detail/StockDetailMinInvest";
import { StockDetailSearch } from "@/components/stock-detail/StockDetailSearch";
import { getStockDetail } from "@/lib/queries/stock-detail";

type StockDetailPageProps = {
  params: Promise<{
    symbol: string;
  }>;
  searchParams: Promise<{
    toast?: string;
  }>;
};

function StockDetailTrading() {
  return <section className="h-48 animate-pulse rounded-b-2xl bg-white" />;
}

function StockDetailRange52() {
  return <section className="h-32 animate-pulse rounded-b-2xl bg-white" />;
}

export default async function StockDetailPage({
  params,
  searchParams,
}: StockDetailPageProps) {
  const { symbol } = await params;
  const resolvedSearchParams = await searchParams;
  const normalizedSymbol = symbol.toUpperCase();

  const result = await getStockDetail({ symbol: normalizedSymbol });

  if (result === null) {
    redirect("/lists/blue-chips?toast=stock-not-found");
  }

  if (result.state.hasPriceData === false && resolvedSearchParams.toast !== "no-price-data") {
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
        sector={result.stock.sector}
        subsector={result.stock.subsector}
        symbol={result.stock.symbol}
      />
      <StockDetailMinInvest
        boardLot={result.stock.boardLot}
        lastClose={result.stock.lastClose}
        minimumInvestment={result.stock.minimumInvestment}
      />
      <StockDetailTrading />
      <StockDetailRange52 />
    </main>
  );
}
