import Link from "next/link";

import { Building2 } from "lucide-react";

import type { StockListEntry } from "@/lib/queries/stock-list";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  formatCurrencyAmount,
  formatStockPrice,
} from "@/lib/currency-format";
import { cn } from "@/lib/utils";

const sharesFormatter = new Intl.NumberFormat("en-PH");

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

const formatBoardLot = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return `${sharesFormatter.format(value)} shares`;
};

const getPercentChangeTone = (value: string | null): "positive" | "negative" | "neutral" => {
  if (value === null) {
    return "neutral";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed === 0) {
    return "neutral";
  }

  return parsed > 0 ? "positive" : "negative";
};

function HelpBadge({
  active = false,
  tone = "neutral",
}: {
  active?: boolean;
  tone?: "neutral" | "blue";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "help-chip inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold leading-none",
        tone === "blue"
          ? active
            ? "border-[#93c5fd] bg-[#93c5fd] text-white"
            : "border-[#93c5fd] bg-[#bfdbfe] text-[#1e40af]"
          : active
            ? "border-[#c7d2fe] bg-[#EEF2FF] text-[#4338ca]"
            : "border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af]",
      )}
    >
      ?
    </span>
  );
}

function PercentChangeExplainer({
  percentChange,
  formattedChange,
}: {
  percentChange: string | null;
  formattedChange: string;
}) {
  return (
    <Accordion type="single" collapsible className="mt-2">
      <AccordionItem
        value="percent-change"
        className={cn(
          "border-none",
          "data-[state=open]:rounded-lg data-[state=open]:border-none data-[state=open]:bg-[#f5f7ff] data-[state=open]:px-[10px] data-[state=open]:pb-[7px] data-[state=open]:pt-[7px]",
        )}
      >
        <AccordionTrigger
          className={cn(
            "w-full px-0 py-1 text-left no-underline hover:no-underline",
            "[&_[data-slot=accordion-trigger-icon]]:hidden",
            "data-[state=open]:py-0",
            "data-[state=open]:[&_.help-label]:font-medium data-[state=open]:[&_.help-label]:text-[#4338ca]",
            "data-[state=open]:[&_.help-chip]:border-[#c7d2fe] data-[state=open]:[&_.help-chip]:bg-[#EEF2FF] data-[state=open]:[&_.help-chip]:text-[#4338ca]",
          )}
        >
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="help-label type-label text-[#6b7280]">Percent change</span>
                <HelpBadge active={false} />
              </div>
              <span
                className={cn(
                  "type-label",
                  getPercentChangeTone(percentChange) === "positive"
                    ? "font-semibold text-[#15803d]"
                    : getPercentChangeTone(percentChange) === "negative"
                      ? "font-semibold text-[#be123c]"
                      : "text-[#9ca3af]",
                )}
              >
                {formattedChange}
              </span>
            </div>
          </AccordionTrigger>

        <AccordionContent className="pb-0 pt-0">
          <div className="mt-2 rounded-[6px] bg-white px-[11px] py-[9px]">
            <p className="type-body-sm text-[#374151]">
              Ang pagbabago ng presyo ng stock mula sa nakaraang araw ng kalakalan.
            </p>

            <div className="mt-2 border-t border-[#f3f4f6] pt-2">
              <div className="flex items-center gap-[6px]">
                <span className="rounded-full bg-[#dcfce7] px-2 py-[2px] text-[11px] font-semibold text-[#15803d]">
                  ▲ Positibo
                </span>
                <span className="type-caption text-[#9ca3af]">=</span>
                <span className="type-body-sm text-[#374151]">tumaas ang presyo</span>
              </div>

              <div className="mt-1 flex items-center gap-[6px]">
                <span className="rounded-full bg-[#ffe4e6] px-2 py-[2px] text-[11px] font-semibold text-[#be123c]">
                  ▼ Negatibo
                </span>
                <span className="type-caption text-[#9ca3af]">=</span>
                <span className="type-body-sm text-[#374151]">bumaba ang presyo</span>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function MinimumInvestmentExplainer({
  boardLot,
  closePrice,
  formattedInvestment,
}: {
  boardLot: number | null;
  closePrice: string | null;
  formattedInvestment: string;
}) {
  const formattedBoardLot = formatBoardLot(boardLot);
  const formattedClosePrice = formatStockPrice(closePrice);
  const hasPrice = closePrice !== null && formattedClosePrice !== "—";

  return (
    <Accordion type="single" collapsible className="mt-3">
      <AccordionItem value="minimum-investment" className="rounded-lg border-none bg-[#dbeafe] px-[10px] py-[7px]">
        <AccordionTrigger
          className={cn(
            "w-full px-0 py-0 text-left no-underline hover:no-underline",
            "[&_[data-slot=accordion-trigger-icon]]:hidden",
            "data-[state=open]:[&_.help-label]:font-medium data-[state=open]:[&_.help-label]:text-[#1e40af]",
            "data-[state=open]:[&_.help-chip]:border-[#93c5fd] data-[state=open]:[&_.help-chip]:bg-[#93c5fd] data-[state=open]:[&_.help-chip]:text-white",
          )}
        >
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="help-label type-label text-[#1e40af]">Min. invest</span>
              <HelpBadge active={false} tone="blue" />
            </div>
            <span className="text-[16px] font-bold text-[#1e3a8a]">{formattedInvestment}</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pb-0 pt-0">
          <div className="mt-2 rounded-[6px] bg-white px-[11px] py-[9px]">
            <div className="flex items-center justify-between border-b border-[#dbeafe] pb-2">
              <span className="type-body-sm text-[#6b7280]">Board lot</span>
              <span className="type-label-strong text-[#1e3a8a]">{formattedBoardLot}</span>
            </div>

            <p className="mt-2 type-body-sm text-[#374151]">
              Ito ang pinakamaliit na halagang kailangan mo para makapag-invest. Kinukuha sa{" "}
              <span className="font-medium text-[#1e40af]">board lot × presyo</span>.
            </p>

            <div className="type-body-sm mt-2 flex flex-wrap items-center gap-1 border-t border-[#dbeafe] pt-2">
              <span className="text-[#374151]">{formattedBoardLot}</span>
              <span className="text-[#9ca3af]">×</span>
              {hasPrice ? (
                <>
                  <span className="text-[#374151]">{formattedClosePrice}</span>
                  <span className="text-[#9ca3af]">=</span>
                  <span className="text-[12px] font-bold text-[#1e3a8a]">{formattedInvestment}</span>
                </>
              ) : (
                <>
                  <span className="text-[#9ca3af]">walang presyo pa</span>
                  <span className="text-[#9ca3af]">=</span>
                  <span className="text-[12px] font-bold text-[#9ca3af]">—</span>
                </>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function StockCard(props: StockListEntry) {
  const initials = getInitials(props.companyName);
  const formattedPrice = formatStockPrice(props.closePrice);
  const formattedChange = formatPercentChange(props.percentChange);
  const formattedInvestment = formatCurrencyAmount(props.minimumInvestment);

  return (
    <article className="rounded-xl border border-[#e5e7eb] border-l-4 border-l-[#4338ca] bg-white px-[14px] py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <Link
        href={`/stocks/${props.symbol}`}
        className="block border-b border-[#eef0f3] pb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2"
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
                <h2 className="type-metric truncate text-[#111111]">
                  {props.symbol}
                </h2>
                {props.sector ? (
                  <span className="type-body-sm truncate text-[#9ca3af]">{props.sector}</span>
                ) : null}
              </div>
              <p className="type-body mt-0.5 truncate text-[#9ca3af]">
                {props.companyName}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="type-price text-[#111111]">
              {formattedPrice}
            </p>
          </div>
        </div>
      </Link>

      <PercentChangeExplainer
        percentChange={props.percentChange}
        formattedChange={formattedChange}
      />

      <MinimumInvestmentExplainer
        boardLot={props.boardLot}
        closePrice={props.closePrice}
        formattedInvestment={formattedInvestment}
      />
    </article>
  );
}
