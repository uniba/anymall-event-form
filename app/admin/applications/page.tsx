import { SlotApplicationStatus } from "@prisma/client";
import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

type ApplicationsPageProps = {
  searchParams?: Promise<{ email?: string; slot?: string; status?: string }>;
};

const statusOptions = Object.values(SlotApplicationStatus);

const inputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

function isStatus(value: string): value is SlotApplicationStatus {
  return statusOptions.includes(value as SlotApplicationStatus);
}

function slotLabel(slot: { startsAt: Date; endsAt: Date; venue: { name: string } }): string {
  return `${slot.venue.name} | ${slot.startsAt.toLocaleString()} - ${slot.endsAt.toLocaleString()}`;
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return age;
}

export default async function AdminApplicationsPage({ searchParams }: ApplicationsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const emailFilter = params?.email?.trim() ?? "";
  const slotFilter = params?.slot?.trim() ?? "";
  const statusRaw = params?.status?.trim() ?? "";
  const statusFilter = isStatus(statusRaw) ? statusRaw : "";

  const [slots, applications] = await Promise.all([
    prisma.slot.findMany({
      include: {
        venue: true
      },
      orderBy: {
        startsAt: "asc"
      }
    }),
    prisma.submissionSlot.findMany({
      where: {
        ...(emailFilter
          ? {
              submission: {
                email: {
                  contains: emailFilter,
                  mode: "insensitive"
                }
              }
            }
          : {}),
        ...(slotFilter ? { slotId: slotFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {})
      },
      include: {
        submission: {
          select: {
            id: true,
            email: true,
            name: true,
            gender: true,
            birthday: true
          }
        },
        slot: {
          include: {
            venue: true
          }
        }
      },
      orderBy: {
        appliedAt: "desc"
      }
    })
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <AdminNav active="applications" />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Applications</h1>

        <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-email">
              Submission Email
            </label>
            <input
              className={inputClassName}
              defaultValue={emailFilter}
              id="filter-email"
              name="email"
              placeholder="user@example.com"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-slot">
              Slot
            </label>
            <select className={inputClassName} defaultValue={slotFilter} id="filter-slot" name="slot">
              <option value="">All slots</option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slotLabel(slot)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-status">
              Status
            </label>
            <select className={inputClassName} defaultValue={statusFilter} id="filter-status" name="status">
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <button className={secondaryButtonClassName} type="submit">
            Search
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Gender</th>
                <th className="px-2 py-2">Age</th>
                <th className="px-2 py-2">Venue</th>
                <th className="px-2 py-2">Slot Time</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Applied At</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr className="border-b border-slate-100 align-top" key={application.id}>
                  <td className="px-2 py-3">{application.submission.email}</td>
                  <td className="px-2 py-3">{application.submission.name}</td>
                  <td className="px-2 py-3">{application.submission.gender}</td>
                  <td className="px-2 py-3">{calculateAge(application.submission.birthday)}</td>
                  <td className="px-2 py-3">{application.slot.venue.name}</td>
                  <td className="px-2 py-3">
                    {application.slot.startsAt.toLocaleString()} - {application.slot.endsAt.toLocaleString()}
                  </td>
                  <td className="px-2 py-3">{application.status}</td>
                  <td className="px-2 py-3">{application.appliedAt.toLocaleString()}</td>
                </tr>
              ))}
              {applications.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={6}>
                    No applications found.
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

