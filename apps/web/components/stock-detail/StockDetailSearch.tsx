"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { FormEvent, useState } from "react";

type StockDetailSearchProps = {
  initialSymbol: string;
};

export function StockDetailSearch({ initialSymbol }: StockDetailSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialSymbol);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return;
    }

    router.push(`/stocks/${normalizedValue}`);
  };

  return (
    <form
      className="flex items-center gap-[10px] border-b border-[#f3f4f6] bg-white px-[14px] py-[10px]"
      onSubmit={handleSubmit}
    >
      <Link
        aria-label="Back to stock list"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4338ca]"
        href="/lists/blue-chips"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-[9px] top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400/40"
        />
        <input
          className="h-10 w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search another stock…"
          value={value}
        />
      </div>
    </form>
  );
}
