import Link from "next/link";

import { Building2 } from "lucide-react";

import type { StockListEntry } from "@/lib/queries/stock-list";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-PH");

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

  const magnitude = Math.abs(parsed).toFixed(2);

  if (parsed > 0) {
    return `+${magnitude}%`;
  }

  if (parsed < 0) {
    return `−${magnitude}%`;
  }

  return `${magnitude}%`;
};

const getPercentChangeTone = (
  value: string | null
): "positive" | "negative" | "neutral" => {
  if (value === null) {
    return "neutral";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed === 0) {
    return "neutral";
  }

  return parsed > 0 ? "positive" : "negative";
};

const getPercentChangeClasses = (tone: "positive" | "negative" | "neutral") => {
  if (tone === "positive") {
    return "bg-[#B2F2BB] text-slate-900";
  }

  if (tone === "negative") {
    return "bg-[#FFB3BB] text-slate-900";
  }

  return "bg-slate-100 text-slate-700";
};

export function StockCard(props: StockListEntry) {
  const changeTone = getPercentChangeTone(props.percentChange);
  const hasLogo = props.logoUrl !== null;
  const initials = getInitials(props.companyName);

  return (
    <Card
      size="sm"
      className="h-full border border-black/5 bg-white shadow-sm transition-transform hover:-translate-y-0.5"
    >
      <Link
        href={`/stocks/${props.symbol}`}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8CEFF]"
      >
        <CardHeader className="gap-3">
          <div className="flex items-start gap-3">
            {hasLogo ? (
              <img
                src={props.logoUrl ?? undefined}
                alt={`${props.companyName} logo`}
                className="h-12 w-12 rounded-xl border border-black/5 object-contain bg-white"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
                {initials.length > 0 ? (
                  <span className="text-sm font-semibold">{initials}</span>
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg font-semibold tracking-tight text-slate-950">
                  {props.symbol}
                </CardTitle>
                {props.sector ? (
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-slate-700"
                  >
                    {props.sector}
                  </Badge>
                ) : null}
              </div>
              <CardDescription className="line-clamp-2 text-sm leading-5 text-slate-600">
                {props.companyName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3">
          <dl className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Price</dt>
              <dd className="font-medium text-slate-900">
                {formatPeso(props.closePrice)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Percent change</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPercentChangeClasses(changeTone)}`}
                >
                  {formatPercentChange(props.percentChange)}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Board lot</dt>
              <dd className="font-medium text-slate-900">
                {props.boardLot === null ? "—" : numberFormatter.format(props.boardLot)}
              </dd>
            </div>
          </dl>

          <div className="rounded-xl border border-[#B8CEFF] bg-[#B8CEFF]/45 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
              Minimum investment
            </p>
            <p className="mt-1 text-base font-semibold text-slate-950">
              {formatPeso(props.minimumInvestment)}
            </p>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
