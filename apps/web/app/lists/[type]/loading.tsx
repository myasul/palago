import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_CARDS = 6;

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <header className="bg-[linear-gradient(160deg,_#fde68a_0%,_#fef3c7_60%)] px-4 pb-5 pt-[18px]">
          <Skeleton className="h-6 w-32 rounded-full bg-white/45" />
          <Skeleton className="mt-2 h-4 w-full max-w-[18rem] rounded-full bg-white/45" />
          <div className="mt-[10px] flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-36 rounded-full bg-white/45" />
            <Skeleton className="h-4 w-24 rounded-full bg-white/45" />
          </div>
        </header>

        <div className="rounded-b-2xl border border-black/5 border-t-0 bg-white shadow-sm">
          <div className="space-y-3 px-4 py-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="flex gap-2 overflow-hidden">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-label="Loading stock results">
        <div className="rounded-2xl bg-transparent px-3 py-2 pb-[14px]">
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: PLACEHOLDER_CARDS }).map((_, index) => (
              <article
                key={index}
                className="rounded-xl border border-[#e5e7eb] border-l-4 border-l-[#4338ca] bg-white px-[14px] py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="min-w-0">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="mt-1 h-4 w-36 rounded-full" />
                      <Skeleton className="mt-2 h-4 w-20 rounded-full" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="ml-auto h-5 w-20 rounded-full" />
                    <Skeleton className="mt-2 ml-auto h-5 w-16 rounded-full" />
                  </div>
                </div>
                <div className="mt-3">
                  <Skeleton className="h-[52px] w-full rounded-lg" />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center rounded-2xl border border-black/5 bg-white px-3 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-12 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-12 rounded-full" />
          </div>
        </div>
      </section>
    </main>
  );
}
