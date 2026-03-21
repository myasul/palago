import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_CARDS = 6;

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-10 w-56 rounded-full" />
        <Skeleton className="h-4 w-full max-w-2xl rounded-full" />
      </header>

      <section className="rounded-2xl border border-black/5 bg-white/80 p-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-24 rounded-full" />
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-label="Loading stock results">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-28 rounded-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: PLACEHOLDER_CARDS }).map((_, index) => (
            <article
              key={index}
              className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
            >
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="mt-3 h-6 w-40 rounded-full" />
              <Skeleton className="mt-2 h-4 w-28 rounded-full" />
              <div className="mt-5 space-y-3">
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
