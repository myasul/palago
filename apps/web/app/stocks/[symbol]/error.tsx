"use client";

type StockDetailErrorProps = {
  reset: () => void;
};

export default function StockDetailError({ reset }: StockDetailErrorProps) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Stock detail unavailable</h1>
        <p className="text-sm leading-6 text-slate-600">
          We couldn&apos;t load this stock detail page right now. Please try again.
        </p>
      </div>

      <button
        className="rounded-full bg-[#4338ca] px-4 py-2 text-sm font-medium text-white"
        onClick={() => reset()}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
