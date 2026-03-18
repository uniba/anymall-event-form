import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { VenuesTable, type VenueTableRow } from "./venues-table";

type VenuesPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

const inputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

export default async function AdminVenuesPage({ searchParams }: VenuesPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const venues = await prisma.venue.findMany({
    where: query
      ? {
          name: {
            contains: query,
            mode: "insensitive"
          }
        }
      : undefined,
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <AdminNav active="venues" />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">会場</h1>

        <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="search-name">
              名前を検索
            </label>
            <input
              className={inputClassName}
              defaultValue={query}
              id="search-name"
              name="q"
              placeholder="会場名前"
              type="text"
            />
          </div>
          <button className={secondaryButtonClassName} type="submit">
            検査
          </button>
        </form>

        <div className="mt-6">
          <p className="mb-1 block text-xs font-medium text-slate-600">
            会場件数: {venues.length}
          </p>
        </div>

        <VenuesTable
          venues={venues.map(
            (venue): VenueTableRow => ({
              id: venue.id,
              name: venue.name,
              address: venue.address
            })
          )}
        />
      </section>
    </main>
  );
}
