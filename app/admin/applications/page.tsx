import { SlotApplicationStatus } from "@prisma/client";
import {
  ApplicationFilters,
  type ApplicationFilterSlotOption,
  type ApplicationFilterVenueOption
} from "@/components/application-filters";
import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { getGenderLabel, getSlotApplicationStatusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

type ApplicationsPageProps = {
  searchParams?: Promise<{ email?: string; venue?: string; slot?: string; status?: string}>;
};

const statusOptions = Object.values(SlotApplicationStatus);

function isStatus(value: string): value is SlotApplicationStatus {
  return statusOptions.includes(value as SlotApplicationStatus);
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
  const venueFilter = params?.venue?.trim() ?? "";
  const slotFilter = params?.slot?.trim() ?? "";
  const statusRaw = params?.status?.trim() ?? "";
  const statusFilter = isStatus(statusRaw) ? statusRaw : "";

  const [venues, slots, applications] = await Promise.all([
    prisma.venue.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: "asc"
      }
    }),
    prisma.slot.findMany({
      select: {
        id: true,
        venueId: true,
        startsAt: true,
        endsAt: true,
        venue: {
          select: {
            name: true
          }
        }
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
                OR: [
                  {
                    email: {
                      contains: emailFilter,
                      mode: "insensitive"
                    }
                  },
                  {
                    name: {
                      contains: emailFilter,
                      mode: "insensitive"
                    }
                  }
                ]
              }
            }
          : {}),
        ...(venueFilter
          ? {
              slot: {
                is: {
                  venueId: venueFilter
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

  const venueOptions: ApplicationFilterVenueOption[] = venues.map((venue) => ({
    id: venue.id,
    name: venue.name
  }));
  const slotOptions: ApplicationFilterSlotOption[] = slots.map((slot) => ({
    id: slot.id,
    venueId: slot.venueId,
    startsAt: slot.startsAt.toISOString(),
    endsAt: slot.endsAt.toISOString(),
    venueName: slot.venue.name
  }));

  const maleCount = applications.filter((application) => application.submission.gender === "MALE").length;
  const femaleCount = applications.filter((application) => application.submission.gender === "FEMALE").length;
  const unspecifiedCount = applications.filter(
    (application) => application.submission.gender === "UNSPECIFIED"
  ).length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <AdminNav active="applications" />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">応募一覧</h1>

        <ApplicationFilters
          defaultEmail={emailFilter}
          defaultSlot={slotFilter}
          defaultStatus={statusFilter}
          defaultVenue={venueFilter}
          slots={slotOptions}
          statusOptions={statusOptions}
          venues={venueOptions}
        />

        <div className="mt-6">
          <p className="mb-1 block text-xs font-medium text-slate-600">
            応募件数: {applications.length} | 男性: {maleCount} | 女性: {femaleCount} | 未回答: {unspecifiedCount}
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">メーイル</th>
                <th className="px-2 py-2">名前</th>
                <th className="px-2 py-2">性別</th>
                <th className="px-2 py-2">年齢</th>
                <th className="px-2 py-2">会場</th>
                <th className="px-2 py-2">スロット日時</th>
                <th className="px-2 py-2">状態</th>
                <th className="px-2 py-2">応募日時</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr className="border-b border-slate-100 align-top" key={application.id}>
                  <td className="px-2 py-3">{application.submission.email}</td>
                  <td className="px-2 py-3">{application.submission.name}</td>
                  <td className="px-2 py-3">{getGenderLabel(application.submission.gender)}</td>
                  <td className="px-2 py-3">{calculateAge(application.submission.birthday)}</td>
                  <td className="px-2 py-3">{application.slot.venue.name}</td>
                  <td className="px-2 py-3">
                    {application.slot.startsAt.toLocaleString()} - {application.slot.endsAt.toLocaleString()}
                  </td>
                  <td className="px-2 py-3">{getSlotApplicationStatusLabel(application.status)}</td>
                  <td className="px-2 py-3">{application.appliedAt.toLocaleString()}</td>
                </tr>
              ))}
              {applications.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={8}>
                    応募はありません
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
