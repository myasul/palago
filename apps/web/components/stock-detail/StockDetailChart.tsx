"use client";

import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

type StockDetailChartRow = {
  tradeDate: string;
  closePrice: string | null;
};

type StockDetailChartProps = {
  rows: StockDetailChartRow[];
  symbol: string;
  selectedRange: string;
};

type ChartPoint = {
  date: string;
  close: number | null;
  label: string;
};

const RANGE_OPTIONS = [
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
] as const;

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const parseIsoDate = (value: string) => {
  const [year, month, day] = value.split("-").map((part) => Number(part));

  return {
    year,
    month,
    day,
  };
};

const formatTooltipDate = (value: string) => {
  const { year, month, day } = parseIsoDate(value);

  return `${MONTHS_SHORT[month - 1]} ${day}, ${year}`;
};

const formatAxisDate = (value: string) => {
  const { month, day } = parseIsoDate(value);

  return `${MONTHS_SHORT[month - 1]} ${day}`;
};

const formatPeso = (value: number) => {
  return `₱${value.toFixed(2)}`;
};

const getDotProps = (hasSinglePoint: boolean) => {
  if (hasSinglePoint) {
    return {
      r: 3,
      fill: "#4338ca",
      strokeWidth: 0,
    };
  }

  return false;
};

function ChartTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as ChartPoint | undefined;

  if (!point) {
    return null;
  }

  return (
    <div className="rounded-[8px] border border-[#e5e7eb] bg-white px-[10px] py-[6px] text-[12px] text-[#111827] shadow-sm">
      <p className="font-medium">{point.label}</p>
      <p className="mt-0.5 text-[#6b7280]">
        {point.close === null ? "No data" : formatPeso(point.close)}
      </p>
    </div>
  );
}

export function StockDetailChart({
  rows,
  symbol,
  selectedRange,
}: StockDetailChartProps) {
  const router = useRouter();

  const chartData: ChartPoint[] = rows.map((row) => ({
    date: row.tradeDate,
    close: row.closePrice !== null ? Number(row.closePrice) : null,
    label: formatTooltipDate(row.tradeDate),
  }));

  const nonNullPrices = chartData.filter(
    (point): point is ChartPoint & { close: number } => point.close !== null
  );

  const periodLow = nonNullPrices.length > 0
    ? Math.min(...nonNullPrices.map((point) => point.close))
    : null;
  const periodHigh = nonNullPrices.length > 0
    ? Math.max(...nonNullPrices.map((point) => point.close))
    : null;
  const tradingDayCount = rows.length;
  const isEmptyState = nonNullPrices.length === 0;
  const dotProps = getDotProps(nonNullPrices.length === 1);

  return (
    <section className="overflow-hidden border border-[#e5e7eb] bg-white">
      <div className="px-[14px] py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6b7280]">
            Price History
          </p>

          <div className="flex items-center gap-1">
            {RANGE_OPTIONS.map((option) => {
              const isActive = option.value === selectedRange;

              return (
                <button
                  key={option.value}
                  className={`rounded-full px-[9px] py-[3px] text-[11px] leading-none ${
                    isActive
                      ? "bg-[#4338ca] font-medium text-white"
                      : "bg-[#f3f4f6] text-[#6b7280]"
                  }`}
                  onClick={() => router.push(`/stocks/${symbol}?range=${option.value}`)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {isEmptyState ? (
          <p className="py-6 text-center text-[11px] text-[#9ca3af]">
            No price history available for this period.
          </p>
        ) : (
          <>
            <div className="h-[140px] w-full">
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4338ca" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#4338ca" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    horizontal
                    stroke="#f3f4f6"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="date"
                    interval="preserveStartEnd"
                    minTickGap={24}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickFormatter={formatAxisDate}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={false}
                    wrapperStyle={{ outline: "none" }}
                  />
                  <Area
                    connectNulls={false}
                    dataKey="close"
                    dot={dotProps}
                    fill="url(#chartGradient)"
                    isAnimationActive={false}
                    stroke="#4338ca"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-[6px] flex items-center justify-between border-t border-[#f3f4f6] pt-2">
              <div>
                <p className="mb-px text-[10px] text-[#9ca3af]">Period low</p>
                <p className="text-[11px] font-semibold text-[#be123c]">
                  {formatPeso(periodLow!)}
                </p>
              </div>

              <div className="text-right">
                <p className="mb-px text-[10px] text-[#9ca3af]">Period high</p>
                <p className="text-[11px] font-semibold text-[#15803d]">
                  {formatPeso(periodHigh!)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {!isEmptyState ? (
        <div className="flex items-center justify-between border-t border-[#f3f4f6] bg-[#f9fafb] px-[10px] py-[6px] text-[10px] text-[#9ca3af]">
          <p>{tradingDayCount} trading days · close price only</p>

          <div className="flex items-center gap-[3px]">
            <svg
              aria-hidden="true"
              fill="none"
              height="9"
              viewBox="0 0 9 9"
              width="9"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="4.5" cy="4.5" r="3.75" stroke="currentColor" strokeWidth="0.75" />
              <path d="M4.5 3V3.1" stroke="currentColor" strokeLinecap="round" strokeWidth="0.75" />
              <path d="M4.5 4.1V6" stroke="currentColor" strokeLinecap="round" strokeWidth="0.75" />
            </svg>
            <span>No volume data</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
