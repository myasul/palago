import { redirect } from "next/navigation";

import { ToastHandler } from "@/components/ToastHandler";
import { getStockDetail } from "@/lib/queries/stock-detail";

type StockDetailPageProps = {
  params: Promise<{
    symbol: string;
  }>;
  searchParams: Promise<{
    toast?: string;
  }>;
};

function StockDetailSearch({ initialSymbol }: { initialSymbol: string }) {
  return (
    <section className="border-b border-black/5 bg-white px-[14px] py-[10px]">
      <div className="flex items-center gap-[10px]">
        <div className="h-8 w-8 rounded-lg bg-[#EEF2FF]" />
        <div className="h-10 flex-1 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 text-sm leading-10 text-slate-400">
          {initialSymbol}
        </div>
      </div>
    </section>
  );
}

function StockDetailHeader() {
  return (
    <section className="bg-[linear-gradient(160deg,_#fde68a_0%,_#fef3c7_60%)] px-4 pb-[18px] pt-[14px]">
      <div className="h-24 animate-pulse rounded-xl bg-white/40" />
    </section>
  );
}

function StockDetailMinInvest() {
  return <section className="h-28 animate-pulse bg-[#dbeafe]" />;
}

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
      <StockDetailHeader />
      <StockDetailMinInvest />
      <StockDetailTrading />
      <StockDetailRange52 />
    </main>
  );
}
