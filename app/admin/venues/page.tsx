import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { VenuesManager } from "./venues-manager";
import type { VenueTableRow } from "./venues-table";

type VenuesPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

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

        <VenuesManager
          initialQuery={query}
          initialVenues={venues.map(
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
