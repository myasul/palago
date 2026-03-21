import type { ReactNode } from "react";

import type { StockListState } from "@/lib/queries/stock-list";

import { cn } from "@/lib/utils";

type PaginationProps = {
  state: StockListState;
  totalPages: number;
};

const getPageHref = (state: StockListState, page: number) => {
  const params = new URLSearchParams();
  const normalizedSearch = state.search?.trim();

  if (state.sector) {
    params.set("sector", state.sector);
  }

  if (state.sort !== "percent_change") {
    params.set("sort", state.sort);
  }

  if (state.order !== "desc") {
    params.set("order", state.order);
  }

  if (normalizedSearch) {
    params.set("search", normalizedSearch);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query.length > 0 ? `/lists/${state.type}?${query}` : `/lists/${state.type}`;
};

const getPageWindow = (currentPage: number, totalPages: number) => {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
};

function PageLink({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex min-w-8 items-center justify-center rounded-full border px-2 py-1 text-xs font-medium transition-colors",
        isActive
          ? "border-[#B8CEFF] bg-[#B8CEFF] text-slate-900"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
      )}
    >
      {children}
    </a>
  );
}

function DisabledPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-400">
      {children}
    </span>
  );
}

export function Pagination({ state, totalPages }: PaginationProps) {
  const currentPage = state.page;
  const pageWindow = getPageWindow(currentPage, totalPages);

  return (
    <nav
      aria-label="Stock list pagination"
      className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white px-3 py-3"
    >
      {currentPage > 1 ? (
        <PageLink href={getPageHref(state, currentPage - 1)}>Prev</PageLink>
      ) : (
        <DisabledPill>Prev</DisabledPill>
      )}

      {pageWindow.map((page, index) => {
        const previousPage = pageWindow[index - 1];
        const showGap = previousPage !== undefined && page - previousPage > 1;

        return (
          <div key={page} className="flex items-center gap-2">
            {showGap ? <span className="text-xs text-slate-400">…</span> : null}
            <PageLink href={getPageHref(state, page)} isActive={page === currentPage}>
              {page}
            </PageLink>
          </div>
        );
      })}

      {currentPage < totalPages ? (
        <PageLink href={getPageHref(state, currentPage + 1)}>Next</PageLink>
      ) : (
        <DisabledPill>Next</DisabledPill>
      )}
    </nav>
  );
}
