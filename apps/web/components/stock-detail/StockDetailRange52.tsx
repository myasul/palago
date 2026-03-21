import type { StockDetailRange52 as StockDetailRange52Data } from "@/lib/queries/stock-detail";
import { get52WeekLabel, getRangeBarPosition } from "@/lib/stock-detail-utils";

type StockDetailRange52Props = {
  lastClose: string | null;
  range52: StockDetailRange52Data | null;
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

export function StockDetailRange52({
  lastClose,
  range52,
}: StockDetailRange52Props) {
  if (range52 === null) {
    return (
      <section className="rounded-b-2xl border-t border-[#f3f4f6] bg-white px-4 py-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
          52-WEEK RANGE
        </p>
        <p className="text-[11px] text-[#9ca3af]">
          52-week range not yet available — not enough trading history.
        </p>
      </section>
    );
  }

  const position = getRangeBarPosition(lastClose, range52.low52, range52.high52);
  const chipPosition = position === null ? null : getChipPositionClasses(position);

  return (
    <section className="rounded-b-2xl border-t border-[#f3f4f6] bg-white px-4 py-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7280]">
        52-WEEK RANGE
      </p>

      <div className="mb-2 flex items-end justify-between">
        <div>
          <p className="text-[10px] text-[#9ca3af]">Low</p>
          <p className="text-[12px] font-semibold text-[#374151]">
            {formatPeso(range52.low52)}
          </p>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-[#9ca3af]">Current</p>
          <p className="text-[12px] font-bold text-[#4338ca]">{formatPeso(lastClose)}</p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-[#9ca3af]">High</p>
          <p className="text-[12px] font-semibold text-[#374151]">
            {formatPeso(range52.high52)}
          </p>
        </div>
      </div>

      {position !== null && chipPosition !== null ? (
        <>
          <div className="relative h-3">
            <div className="absolute top-1/2 h-[6px] w-full -translate-y-1/2 rounded-full bg-[#e5e7eb]" />
            <div
              className="absolute top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-[#c7d2fe]"
              style={{ width: `${position}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#4338ca] bg-white"
              style={{ left: `${position}%` }}
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

          <p className="mt-1 text-[10px] text-[#9ca3af]">
            {get52WeekLabel(lastClose, range52.low52, range52.high52)}
          </p>
        </>
      ) : (
        <p className="text-[11px] text-[#9ca3af]">
          52-week range not yet available — not enough trading history.
        </p>
      )}
    </section>
  );
}
