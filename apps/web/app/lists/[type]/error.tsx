"use client";

type StockListErrorProps = {
  reset: () => void;
};

export default function Error({ reset }: StockListErrorProps) {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-2xl items-center px-4 py-8 sm:px-6">
      <section className="w-full rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Stock List
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We could not load this stock list right now. Please try again.
        </p>
        <button
          className="mt-6 inline-flex items-center rounded-full bg-[#B8CEFF] px-4 py-2 text-sm font-medium text-slate-900 transition hover:brightness-95"
          onClick={() => reset()}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
