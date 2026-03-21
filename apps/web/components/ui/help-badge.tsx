import { cn } from "@/lib/utils";

type HelpBadgeProps = {
  active?: boolean;
  tone?: "neutral" | "blue";
  className?: string;
};

export function HelpBadge({
  active = false,
  tone = "neutral",
  className,
}: HelpBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "help-chip inline-flex size-4 shrink-0 items-center justify-center rounded-full border text-center text-[9px] leading-none font-bold",
        tone === "blue"
          ? active
            ? "border-[#93c5fd] bg-[#93c5fd] text-white"
            : "border-[#93c5fd] bg-[#bfdbfe] text-[#1e40af]"
          : active
            ? "border-[#c7d2fe] bg-[#EEF2FF] text-[#4338ca]"
            : "border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af]",
        className,
      )}
    >
      ?
    </span>
  );
}
