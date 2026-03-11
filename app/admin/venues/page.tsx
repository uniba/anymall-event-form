import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

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
        <h1 className="text-xl font-semibold text-slate-900">Venues</h1>

        <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="search-name">
              Search Name
            </label>
            <input
              className={inputClassName}
              defaultValue={query}
              id="search-name"
              name="q"
              placeholder="Venue name"
              type="text"
            />
          </div>
          <button className={secondaryButtonClassName} type="submit">
            Search
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Address</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((venue) => (
                <tr className="border-b border-slate-100 align-top" key={venue.id}>
                  <td className="px-2 py-3 font-mono text-xs">{venue.id}</td>
                  <td className="px-2 py-3">{venue.name}</td>
                  <td className="px-2 py-3">{venue.address ?? "-"}</td>
                </tr>
              ))}
              {venues.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={3}>
                    No venues found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

