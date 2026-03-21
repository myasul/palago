const formatPeso = (value: string | null) => {
  if (value === null) {
    return "—";
  }

  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

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
          <p className="mb-[3px] text-[10px] font-semibold uppercase tracking-[0.07em] text-[#1e40af]">
            MINIMUM INVESTMENT
          </p>
          <p className="text-[28px] font-bold leading-none tracking-[-0.02em] text-[#1e3a8a]">
            {formatPeso(minimumInvestment)}
          </p>
        </div>

        <div className="text-right">
          <p className="mb-[2px] text-[10px] text-[#3b82f6]">Board Lot</p>
          <p className="text-[14px] font-semibold text-[#1e3a8a]">{boardLotValue}</p>
        </div>
      </div>

      {lastClose !== null && (
        <div className="flex flex-wrap items-center gap-1 border-t border-[#bfdbfe] pt-2">
          <span className="text-[11px] font-medium text-[#1e40af]">
            {boardLotValue}
          </span>
          <span className="text-[11px] text-[#3b82f6]">×</span>
          <span className="text-[11px] font-medium text-[#1e40af]">{formatPeso(lastClose)}</span>
          <span className="text-[11px] text-[#3b82f6]">=</span>
          <span className="text-[12px] font-bold text-[#1e3a8a]">
            {formatPeso(minimumInvestment)}
          </span>
          <span className="text-[10px] text-[#3b82f6]">· Cannot buy fewer.</span>
        </div>
      )}
    </section>
  );
}
