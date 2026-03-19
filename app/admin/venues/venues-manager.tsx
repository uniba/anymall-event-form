"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { VenuesTable, type VenueTableRow } from "./venues-table";

type VenuesManagerProps = {
  initialQuery: string;
  initialVenues: VenueTableRow[];
};

const inputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const primaryButtonClassName =
  "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

export function VenuesManager({ initialQuery, initialVenues }: VenuesManagerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [createRequestCount, setCreateRequestCount] = useState(0);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextQuery = query.trim();
    const params = new URLSearchParams();
    if (nextQuery) {
      params.set("q", nextQuery);
    }

    const url = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(url);
    router.refresh();
  }

  function onVenueCreated() {
    setQuery("");
    router.replace(pathname);
    router.refresh();
  }

  return (
    <>
      <form className="mt-4 flex flex-wrap items-end justify-between gap-3" onSubmit={onSearchSubmit}>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="search-name">
              名前を検索
            </label>
            <input
              className={inputClassName}
              id="search-name"
              name="q"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="会場名前"
              type="text"
              value={query}
            />
          </div>
          <button className={secondaryButtonClassName} type="submit">
            検査
          </button>
        </div>

        <button
          className={primaryButtonClassName}
          onClick={() => setCreateRequestCount((current) => current + 1)}
          type="button"
        >
          新しい会場を追加
        </button>
      </form>

      <div className="mt-6">
        <p className="mb-1 block text-xs font-medium text-slate-600">会場件数: {initialVenues.length}</p>
      </div>

      <VenuesTable
        createRequestCount={createRequestCount}
        onVenueCreated={onVenueCreated}
        venues={initialVenues}
      />
    </>
  );
}
