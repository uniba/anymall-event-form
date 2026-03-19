import { SlotApplicationStatus } from "@prisma/client";
import {
  ApplicationFilters,
  type ApplicationFilterSlotOption,
  type ApplicationFilterVenueOption
} from "@/components/application-filters";
import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { ApplicationsTable, type ApplicationTableRow } from "./applications-table";

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
            furigana: true,
            gender: true,
            birthday: true,
            prefecture: true,
            memo: true
          }
        },
        slot: {
          include: {
            venue: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
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
            応募件数: {applications.length}
          </p>
        </div>

        <ApplicationsTable
          applications={applications.map(
            (application): ApplicationTableRow => ({
              id: application.id,
              submissionEmail: application.submission.email,
              submissionName: application.submission.name,
              submissionFurigana: application.submission.furigana,
              submissionGender: application.submission.gender,
              submissionAge: application.submission.birthday ? calculateAge(application.submission.birthday) : null,
              submissionPrefecture: application.submission.prefecture,
              submissionMemo: application.submission.memo,
              venueName: application.slot.venue.name,
              startsAt: application.slot.startsAt.toISOString(),
              endsAt: application.slot.endsAt.toISOString(),
              status: application.status,
              createdAt: application.createdAt.toISOString()
            })
          )}
          statusOptions={statusOptions}
        />
      </section>
    </main>
  );
}
