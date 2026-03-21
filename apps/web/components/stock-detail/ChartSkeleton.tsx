import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton() {
  return (
    <section className="rounded-[12px] border border-[#e5e7eb] bg-white px-[14px] py-3">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-full bg-[#f3f4f6]" />
        <Skeleton className="h-[140px] w-full bg-[#f3f4f6]" />
        <Skeleton className="h-7 w-full bg-[#f3f4f6]" />
      </div>
    </section>
  );
}
