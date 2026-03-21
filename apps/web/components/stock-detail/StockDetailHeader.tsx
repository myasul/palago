import type { StockDetailPriceSnapshot } from "@/lib/queries/stock-detail";

const formatPeso = (value: string | null) => {
  if (value === null) {
    return "—";
  }

  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getInitials = (companyName: string) => {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const getPercentChangeContent = (percentChange: string | null) => {
  if (percentChange === null) {
    return {
      className: "text-[12px] text-[#92400e]/70",
      content: "—",
    };
  }

  const parsed = Number(percentChange);
  const formatted = Math.abs(parsed).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (parsed > 0) {
    return {
      className:
        "rounded-full bg-white/70 px-[10px] py-[2px] text-[12px] font-semibold text-[#15803d]",
      content: `▲ +${formatted} (${formatted}%)`,
    };
  }

  if (parsed < 0) {
    return {
      className:
        "rounded-full bg-white/70 px-[10px] py-[2px] text-[12px] font-semibold text-[#be123c]",
      content: `▼ −${formatted} (${formatted}%)`,
    };
  }

  return {
    className: "text-[12px] font-semibold text-slate-500",
    content: "0.00 (0.00%)",
  };
};

type StockDetailHeaderProps = Pick<
  StockDetailPriceSnapshot,
  "symbol" | "companyName" | "sector" | "subsector" | "logoUrl" | "lastClose" | "percentChange"
>;

export function StockDetailHeader({
  symbol,
  companyName,
  sector,
  subsector,
  logoUrl,
  lastClose,
  percentChange,
}: StockDetailHeaderProps) {
  const percentChangeContent = getPercentChangeContent(percentChange);
  const identityParts = [symbol, sector, subsector].filter(Boolean);

  return (
    <section className="bg-[linear-gradient(160deg,_#fde68a_0%,_#fef3c7_60%)] px-4 pb-[18px] pt-[14px]">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#92400e]">
        STOCK DETAIL
      </p>

      <div className="mb-[10px] flex gap-[10px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
          {logoUrl ? (
            <img alt={companyName} className="h-full w-full object-cover" src={logoUrl} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#EEF2FF] text-[10px] font-bold text-[#4338ca]">
              {getInitials(companyName)}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="text-[16px] font-bold leading-[1.2] tracking-[-0.02em] text-[#1c1917]">
            {companyName}
          </h1>
          <p className="mt-px truncate text-[11px] text-[#78350f]">
            {identityParts.join(" · ")}
          </p>
        </div>
      </div>

      <p className="mb-[6px] text-[30px] font-bold leading-none tracking-[-0.03em] text-[#1c1917]">
        {formatPeso(lastClose)}
      </p>

      <div className="flex items-center justify-between gap-3">
        <div className={percentChangeContent.className}>{percentChangeContent.content}</div>

        <div className="flex shrink-0 items-center gap-[3px] text-[10px] text-[#92400e]">
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="#92400e" strokeWidth="1.5" />
            <path
              d="M8 7v4M8 5.5v.5"
              stroke="#92400e"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>Data delayed 15 min</span>
        </div>
      </div>
    </section>
  );
}
