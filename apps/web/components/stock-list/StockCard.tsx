import Link from "next/link";

import { Building2 } from "lucide-react";

import type { StockListEntry } from "@/lib/queries/stock-list";

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const getInitials = (value: string): string => {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "PL";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
};

const formatPeso = (value: string | null): string => {
  if (value === null) {
    return "—";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return pesoFormatter.format(parsed);
};

const formatPercentChange = (value: string | null): string => {
  if (value === null) {
    return "—";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  const magnitude = `${Math.abs(parsed).toFixed(2)}%`;

  if (parsed > 0) {
    return `▲ ${magnitude}`;
  }

  if (parsed < 0) {
    return `▼ ${magnitude}`;
  }

  return magnitude;
};

const getPercentChangeClasses = (value: string | null) => {
  if (value === null) {
    return "text-[#9ca3af]";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed === 0) {
    return "text-[#9ca3af]";
  }

  if (parsed > 0) {
    return "rounded-full bg-[#dcfce7] px-[6px] py-[1px] text-[11px] font-semibold text-[#15803d]";
  }

  return "rounded-full bg-[#ffe4e6] px-[6px] py-[1px] text-[11px] font-semibold text-[#be123c]";
};

export function StockCard(props: StockListEntry) {
  const initials = getInitials(props.companyName);
  const formattedPrice = formatPeso(props.closePrice);
  const formattedChange = formatPercentChange(props.percentChange);
  const formattedInvestment = formatPeso(props.minimumInvestment);
  const changeClasses = getPercentChangeClasses(props.percentChange);

  return (
    <article className="rounded-xl border border-[#e5e7eb] border-l-4 border-l-[#4338ca] bg-white px-[14px] py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <Link
        href={`/stocks/${props.symbol}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {props.logoUrl ? (
              <img
                src={props.logoUrl}
                alt={`${props.companyName} logo`}
                className="h-9 w-9 shrink-0 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[10px] font-semibold text-[#4338ca]">
                {initials.length > 0 ? initials : <Building2 className="h-4 w-4" />}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <h2 className="truncate text-[14px] font-semibold text-[#111111]">
                  {props.symbol}
                </h2>
                {props.sector ? (
                  <span className="truncate text-[11px] text-[#9ca3af]">{props.sector}</span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-[#9ca3af]">{props.companyName}</p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[15px] font-semibold text-[#111111]">{formattedPrice}</p>
            <div className="mt-1">
              {props.percentChange === null ? (
                <span className="text-[11px] text-[#9ca3af]">{formattedChange}</span>
              ) : (
                <span className={changeClasses}>{formattedChange}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-[#dbeafe] px-[10px] py-[7px]">
          <span className="text-[11px] font-medium text-[#1e40af]">Min. invest</span>
          <span className="text-[16px] font-bold text-[#1e3a8a]">{formattedInvestment}</span>
        </div>
      </Link>
    </article>
  );
}
