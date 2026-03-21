import type { StockDetailPriceSnapshot } from "@/lib/queries/stock-detail";
import { formatStockPrice } from "@/lib/currency-format";
import { getPriceChange } from "@/lib/stock-detail-utils";

const getInitials = (companyName: string) => {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const getPercentChangeContent = (
  percentChange: string | null,
  lastClose: string | null,
  prevClose: string | null
) => {
  const priceChange = getPriceChange(lastClose, prevClose);

  if (percentChange === null) {
    return {
      className: "text-[15px] font-bold text-[#9ca3af]",
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
      className: "text-[15px] font-bold text-[#15803d]",
      content:
        priceChange === null
          ? "—"
          : `▲ ${priceChange.formatted} (${formatted}%)`,
    };
  }

  if (parsed < 0) {
    return {
      className: "text-[15px] font-bold text-[#be123c]",
      content:
        priceChange === null
          ? "—"
          : `▼ ${priceChange.formatted} (−${formatted}%)`,
    };
  }

  return {
    className: "text-[15px] font-bold text-[#44403c]",
    content: "0.00 (0.00%)",
  };
};

const getHeroPriceContent = (
  lastClose: string | null,
  percentChange: string | null
) => {
  if (percentChange === null) {
    return {
      className: "text-[#9ca3af]",
      content: "—",
    };
  }

  const parsed = Number(percentChange);

  if (parsed > 0) {
    return {
      className: "text-[#15803d]",
      content: formatStockPrice(lastClose),
    };
  }

  if (parsed < 0) {
    return {
      className: "text-[#be123c]",
      content: formatStockPrice(lastClose),
    };
  }

  return {
    className: "text-[#1c1917]",
    content: formatStockPrice(lastClose),
  };
};

type StockDetailHeaderProps = Pick<
  StockDetailPriceSnapshot,
  | "symbol"
  | "companyName"
  | "sector"
  | "subsector"
  | "logoUrl"
  | "lastClose"
  | "prevClose"
  | "percentChange"
>;

export function StockDetailHeader({
  symbol,
  companyName,
  sector,
  subsector,
  logoUrl,
  lastClose,
  prevClose,
  percentChange,
}: StockDetailHeaderProps) {
  const heroPriceContent = getHeroPriceContent(lastClose, percentChange);
  const percentChangeContent = getPercentChangeContent(
    percentChange,
    lastClose,
    prevClose
  );
  const identityParts = [symbol, sector, subsector].filter(Boolean);

  return (
    <section className="bg-[linear-gradient(160deg,_#fde68a_0%,_#fef3c7_60%)] px-4 pb-4 pt-3">
      <p className="type-overline mb-[7px] tracking-[0.14em] text-[#92400e]">
        STOCK DETAIL
      </p>

      <div className="mb-2 flex gap-[10px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
          {logoUrl ? (
            <img alt={companyName} className="h-full w-full object-cover" src={logoUrl} />
          ) : (
            <div className="type-overline flex h-full w-full items-center justify-center bg-[#EEF2FF] tracking-normal text-[#4338ca]">
              {getInitials(companyName)}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="type-metric tracking-[-0.02em] text-[#1c1917]">
            {companyName}
          </h1>
          <p className="type-caption mt-px truncate text-[#78350f]">
            {identityParts.join(" · ")}
          </p>
        </div>
      </div>

      <p
        className={`type-hero mb-[8px] ${heroPriceContent.className}`}
      >
        {heroPriceContent.content}
      </p>

      <div className="mb-[8px] flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="type-overline mb-[2px] tracking-[0.07em] text-[#92400e]">Change</p>
          <p className={percentChangeContent.className}>{percentChangeContent.content}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="type-overline mb-[2px] tracking-[0.07em] text-[#92400e]">Prev Close</p>
          <p
            className={`type-stat ${
              prevClose === null ? "text-[#9ca3af]" : "text-[#44403c]"
            }`}
          >
            {prevClose === null ? "—" : formatStockPrice(prevClose)}
          </p>
        </div>
      </div>

      <div className="type-overline flex items-center gap-[3px] tracking-normal text-[#92400e]">
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
    </section>
  );
}
