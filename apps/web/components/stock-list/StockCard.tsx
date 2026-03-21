import Link from "next/link";

import { Building2 } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import type { StockListEntry } from "@/lib/queries/stock-list";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpBadge } from "@/components/ui/help-badge";
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

const getAccentStripClassName = (value: string | null) => {
  if (value === null) {
    return "border-l-[#e5e7eb]";
  }

  const tone = getPercentChangeTone(value);

  if (tone === "positive") {
    return "border-l-[#15803d]";
  }

  if (tone === "negative") {
    return "border-l-[#be123c]";
  }

  return "border-l-[#9ca3af]";
};

const getPriceClassName = (value: string | null) => {
  if (value === null) {
    return "text-[#9ca3af]";
  }

  const tone = getPercentChangeTone(value);

  if (tone === "positive") {
    return "text-[#15803d]";
  }

  if (tone === "negative") {
    return "text-[#be123c]";
  }

  return "text-[#374151]";
};

const formatChangePill = ({
  percentChange,
  pesoChange,
}: {
  percentChange: string | null;
  pesoChange: string | null;
}) => {
  if (percentChange === null || pesoChange === null) {
    return {
      className: "bg-[#f9fafb] text-[#9ca3af]",
      content: "—",
      showHelp: false,
    };
  }

  const parsedPercent = Number(percentChange);
  const parsedPesoChange = Number(pesoChange);

  if (!Number.isFinite(parsedPercent) || !Number.isFinite(parsedPesoChange)) {
    return {
      className: "bg-[#f9fafb] text-[#9ca3af]",
      content: "—",
      showHelp: false,
    };
  }

  const formattedPercent = Math.abs(parsedPercent).toFixed(2);
  const formattedPesoChange = Math.abs(parsedPesoChange).toFixed(2);

  if (parsedPercent > 0) {
    return {
      className: "bg-[#dcfce7] text-[#15803d]",
      content: `▲ +${formattedPesoChange} (${formattedPercent}%)`,
      showHelp: true,
    };
  }

  if (parsedPercent < 0) {
    return {
      className: "bg-[#ffe4e6] text-[#be123c]",
      content: `▼ −${formattedPesoChange} (−${formattedPercent}%)`,
      showHelp: true,
    };
  }

  return {
    className: "bg-[#f3f4f6] text-[#6b7280]",
    content: "0.00 (0.00%)",
    showHelp: true,
  };
};

function PercentChangeExplainer({
  prevClose,
  changePill,
}: {
  prevClose: string | null;
  changePill: {
    className: string;
    content: string;
    showHelp: boolean;
  };
}) {
  return (
    <Accordion type="single" collapsible className="mt-1.5">
      <AccordionItem
        value="percent-change"
        className={cn(
          "border-none",
          "data-[state=open]:rounded-lg data-[state=open]:border-none data-[state=open]:bg-[#f5f7ff] data-[state=open]:px-[9px] data-[state=open]:pb-[6px] data-[state=open]:pt-[6px]",
        )}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-[#f3f4f6] py-1">
          <div className="flex min-w-0 items-center gap-1">
            <span
              className={cn(
                "inline-flex min-w-0 max-w-full rounded-full px-[7px] py-[2px] text-[11px] font-semibold leading-none",
                changePill.className,
              )}
            >
              <span className="truncate">{changePill.content}</span>
            </span>

            {changePill.showHelp ? (
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger
                  className={cn(
                    "inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-1",
                    "[&[data-state=open]_.help-chip]:border-[#c7d2fe] [&[data-state=open]_.help-chip]:bg-[#EEF2FF] [&[data-state=open]_.help-chip]:text-[#4338ca]",
                  )}
                >
                  <HelpBadge active={false} />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
            ) : null}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] text-[#9ca3af]">Prev close</p>
            <p
              className={cn(
                "text-[12px] font-semibold",
                prevClose === null ? "text-[#9ca3af]" : "text-[#44403c]",
              )}
            >
              {prevClose === null ? "—" : formatStockPrice(prevClose)}
            </p>
          </div>
        </div>

        <AccordionContent className="pb-0 pt-0">
          <div className="mt-1.5 rounded-[6px] bg-white px-[10px] py-[8px]">
            <p className="type-body-sm text-[#374151]">
              Ang pagbabago ng presyo ng stock mula sa nakaraang araw ng kalakalan.
            </p>

            <div className="mt-1.5 border-t border-[#f3f4f6] pt-1.5">
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
    <Accordion type="single" collapsible className="mt-2">
      <AccordionItem
        value="minimum-investment"
        className={cn(
          "rounded-lg border-none px-[10px] py-[6px]",
          hasPrice ? "bg-[#dbeafe]" : "bg-[#f9fafb]",
        )}
      >
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
              <span
                className={cn(
                  "help-label type-label",
                  hasPrice ? "text-[#1e40af]" : "text-[#9ca3af]",
                )}
              >
                Min. invest
              </span>
              <HelpBadge active={false} tone="blue" />
            </div>
            <span
              className={cn(
                "text-[16px] font-bold",
                hasPrice ? "text-[#1e3a8a]" : "text-[#9ca3af]",
              )}
            >
              {hasPrice ? formattedInvestment : "—"}
            </span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pb-0 pt-0">
          <div className="mt-1.5 rounded-[6px] bg-white px-[10px] py-[8px]">
            <div className="flex items-center justify-between border-b border-[#dbeafe] pb-1.5">
              <span className="type-body-sm text-[#6b7280]">Board lot</span>
              <span className="type-label-strong text-[#1e3a8a]">{formattedBoardLot}</span>
            </div>

            <p className="mt-1.5 type-body-sm text-[#374151]">
              Ito ang pinakamaliit na halagang kailangan mo para makapag-invest. Kinukuha sa{" "}
              <span className="font-medium text-[#1e40af]">board lot × presyo</span>.
            </p>

            <div className="type-body-sm mt-1.5 flex flex-wrap items-center gap-1 border-t border-[#dbeafe] pt-1.5">
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
  const formattedInvestment = formatCurrencyAmount(props.minimumInvestment);
  const changePill = formatChangePill({
    percentChange: props.percentChange,
    pesoChange: props.pesoChange,
  });
  const priceClassName = getPriceClassName(props.percentChange);
  const accentStripClassName = getAccentStripClassName(props.percentChange);

  return (
    <article
      className={cn(
        "rounded-xl border border-[#e5e7eb] border-l-4 bg-white px-[13px] py-[10px] shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        accentStripClassName,
      )}
    >
      <Link
        href={`/stocks/${props.symbol}`}
        className="block border-b border-[#eef0f3] pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-start gap-2.5">
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
              <div className="flex min-w-0 items-center gap-1">
                <h2 className="type-metric truncate text-[#111111]">
                  {props.symbol}
                </h2>
                {props.sector ? (
                  <span className="type-body-sm truncate text-[#9ca3af]">{props.sector}</span>
                ) : null}
              </div>
              <p className="type-body truncate text-[#9ca3af]">
                {props.companyName}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className={cn("type-price", props.closePrice === null ? "text-[#9ca3af]" : priceClassName)}>
              {props.closePrice === null ? "—" : formattedPrice}
            </p>
          </div>
        </div>
      </Link>

      <PercentChangeExplainer
        prevClose={props.prevClose}
        changePill={changePill}
      />

      <MinimumInvestmentExplainer
        boardLot={props.boardLot}
        closePrice={props.closePrice}
        formattedInvestment={formattedInvestment}
      />
    </article>
  );
}
