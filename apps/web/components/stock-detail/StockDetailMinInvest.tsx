import { formatCurrencyAmount, formatStockPrice } from "@/lib/currency-format";

type StockDetailMinInvestProps = {
  boardLot: number | null;
  lastClose: string | null;
  minimumInvestment: string | null;
};

export function StockDetailMinInvest({
  boardLot,
  lastClose,
  minimumInvestment,
}: StockDetailMinInvestProps) {
  const boardLotValue = boardLot === null ? "—" : `${boardLot.toLocaleString("en-PH")} shares`;

  return (
    <section className="border-b border-[#bfdbfe] bg-[#dbeafe] px-4 py-3">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <p className="type-overline mb-[3px] tracking-[0.07em] text-[#1e40af]">
            MINIMUM INVESTMENT
          </p>
          <p className="type-hero text-[28px] tracking-[-0.02em] text-[#1e3a8a]">
            {formatCurrencyAmount(minimumInvestment)}
          </p>
        </div>

        <div className="text-right">
          <p className="type-overline mb-[2px] tracking-[0.07em] text-[#3b82f6]">Board Lot</p>
          <p className="type-label-strong text-[#1e3a8a]">{boardLotValue}</p>
        </div>
      </div>

      {lastClose !== null && (
        <div className="flex flex-wrap items-center gap-1 border-t border-[#bfdbfe] pt-2">
          <span className="type-caption text-[#1e40af]">
            {boardLotValue}
          </span>
          <span className="type-caption text-[#3b82f6]">×</span>
          <span className="type-caption text-[#1e40af]">{formatStockPrice(lastClose)}</span>
          <span className="type-caption text-[#3b82f6]">=</span>
          <span className="text-[12px] font-bold text-[#1e3a8a]">
            {formatCurrencyAmount(minimumInvestment)}
          </span>
          <span className="type-overline tracking-normal text-[#3b82f6]">· Cannot buy fewer.</span>
        </div>
      )}
    </section>
  );
}
