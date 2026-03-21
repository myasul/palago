import { Skeleton } from "@/components/ui/skeleton";

export default function StockDetailLoading() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col bg-[#f8fafc] pb-10">
      <section className="border-b border-black/5 bg-white px-[14px] py-[10px]">
        <div className="flex items-center gap-[10px]">
          <Skeleton className="h-8 w-8 rounded-lg bg-[#EEF2FF]" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </section>

      <section className="space-y-4">
        <section className="bg-[linear-gradient(160deg,_#fde68a_0%,_#fef3c7_60%)] px-4 pb-[18px] pt-[14px]">
          <Skeleton className="mb-3 h-3 w-24 bg-white/60" />
          <div className="mb-4 flex items-start gap-[10px]">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/70" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40 bg-white/70" />
              <Skeleton className="h-3 w-32 bg-white/60" />
            </div>
          </div>
          <Skeleton className="mb-3 h-8 w-36 bg-white/70" />
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-28 rounded-full bg-white/70" />
            <Skeleton className="h-3 w-24 bg-white/60" />
          </div>
        </section>

        <section className="bg-[#dbeafe] px-4 py-3">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32 bg-white/60" />
              <Skeleton className="h-8 w-36 bg-white/70" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="ml-auto h-3 w-16 bg-white/60" />
              <Skeleton className="ml-auto h-5 w-20 bg-white/70" />
            </div>
          </div>
          <Skeleton className="h-8 w-full rounded-md bg-white/70" />
        </section>

        <section className="rounded-2xl bg-white px-4 py-4 shadow-sm">
          <Skeleton className="mb-4 h-4 w-32" />
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="mb-3 h-12 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </section>

        <section className="rounded-2xl bg-white px-4 py-4 shadow-sm">
          <Skeleton className="mb-4 h-4 w-28" />
          <Skeleton className="mb-3 h-14 rounded-xl" />
          <Skeleton className="h-4 w-48" />
        </section>
      </section>
    </main>
  );
}
