export function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-600">
      <h2 className="text-base font-semibold text-slate-950">No matching stocks yet</h2>
      <p className="mt-2 leading-6">
        No stocks match the filters you have applied right now.
      </p>
      <ul className="mt-3 space-y-1 text-slate-500">
        <li>Clear the search term to widen the list.</li>
        <li>Change the sector filter to explore a different group.</li>
      </ul>
    </section>
  );
}
