import {
  getCloseVsOpenSubtitle,
  getIntradaySecondaryText,
  getRangeBarPosition,
} from "@/lib/stock-detail-utils";

type StockDetailTradingProps = {
  openPrice: string | null;
  lastClose: string | null;
  highPrice: string | null;
  lowPrice: string | null;
  volume: number | null;
  value: string | null;
  tradeDate: string | null;
  percentChange: string | null;
};

const formatPeso = (value: string | null) => {
  if (value === null) {
    return "—";
  }

  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatVolume = (value: number | null) => {
  if (value === null) {
    return "—";
  }

  return value.toLocaleString("en-PH");
};

const formatTradeDate = (value: string | null) => {
  if (value === null) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
};

const getCloseValueClasses = (
  tone: "positive" | "negative" | "neutral" | null
) => {
  if (tone === "positive") {
    return "bg-[#f0fdf4] text-[#15803d]";
  }

  if (tone === "negative") {
    return "bg-[#fff8f8] text-[#be123c]";
  }

  return "bg-white text-[#111111]";
};

const getChipPositionClasses = (position: number) => {
  if (position <= 10) {
    return {
      className: "left-0 translate-x-0",
      style: undefined,
    };
  }

  if (position >= 90) {
    return {
      className: "right-0 translate-x-0",
      style: undefined,
    };
  }

  return {
    className: "-translate-x-1/2",
    style: { left: `${position}%` },
  };
};

export function StockDetailTrading({
  openPrice,
  lastClose,
  highPrice,
  lowPrice,
  volume,
  value,
  tradeDate,
  percentChange: _percentChange,
}: StockDetailTradingProps) {
  const closeVsOpen = getCloseVsOpenSubtitle(lastClose, openPrice);
  const rangePosition = getRangeBarPosition(lastClose, lowPrice, highPrice);
  const intradaySecondaryText = getIntradaySecondaryText(
    lastClose,
    lowPrice,
    highPrice
  );
  const chipPosition = rangePosition === null ? null : getChipPositionClasses(rangePosition);

  return (
    <section className="bg-white">
      <div className="flex items-center justify-between border-b border-[#f3f4f6] px-4 py-[10px]">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
          TODAY&apos;S TRADING
        </p>
        <p className="text-[10px] text-[#9ca3af]">{formatTradeDate(tradeDate)}</p>
      </div>

      <div className="grid grid-cols-2 border-b border-[#f3f4f6]">
        <div className="border-r border-[#f3f4f6] px-4 py-[10px]">
          <p className="text-[10px] text-[#9ca3af]">Open</p>
          <p className="mt-1 text-[16px] font-semibold text-[#111111]">
            {formatPeso(openPrice)}
          </p>
          <p className="mt-1 text-[10px] text-[#9ca3af]">Market opened here</p>
        </div>

        <div className={`px-4 py-[10px] ${getCloseValueClasses(closeVsOpen?.tone ?? null)}`}>
          <p className="text-[10px] text-[#9ca3af]">Last Close</p>
          <p className="mt-1 text-[16px] font-bold">{formatPeso(lastClose)}</p>
          {closeVsOpen ? <p className="mt-1 text-[10px]">{closeVsOpen.text}</p> : null}
        </div>
      </div>

      <div className="border-b border-[#f3f4f6] px-4 py-[10px]">
        <div className="mb-[6px] flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#9ca3af]">Low</p>
            <p className="text-[12px] font-medium text-[#be123c]">
              {formatPeso(lowPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#9ca3af]">High</p>
            <p className="text-[12px] font-medium text-[#15803d]">
              {formatPeso(highPrice)}
            </p>
          </div>
        </div>

        {rangePosition !== null && chipPosition !== null ? (
          <div>
            <div className="relative h-3">
              <div className="absolute top-1/2 h-[6px] w-full -translate-y-1/2 rounded-full bg-[#e5e7eb]" />
              <div
                className="absolute top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-[#c7d2fe]"
                style={{ width: `${rangePosition}%` }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#4338ca] bg-white"
                style={{ left: `${rangePosition}%` }}
              />
            </div>

            <div className="relative mt-2 h-6">
              <div
                className={`absolute inline-flex rounded-full bg-[#EEF2FF] px-2 py-1 text-[10px] font-semibold leading-none text-[#4338ca] ${chipPosition.className}`}
                style={chipPosition.style}
              >
                {formatPeso(lastClose)} now
              </div>
            </div>

            {intradaySecondaryText ? (
              <p className="mt-1 text-[10px] text-[#9ca3af]">
                {intradaySecondaryText}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-[10px] text-[#9ca3af]">—</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 py-[10px]">
        <div>
          <p className="text-[10px] text-[#9ca3af]">Volume</p>
          <p className="mt-1 text-[12px] text-[#6b7280]">{formatVolume(volume)}</p>
        </div>

        <div>
          <p className="text-[10px] text-[#9ca3af]">Value</p>
          <p className="mt-1 text-[12px] text-[#6b7280]">{formatPeso(value)}</p>
        </div>
      </div>
    </section>
  );
}
