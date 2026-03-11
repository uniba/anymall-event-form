import { revalidatePath } from "next/cache";
import { Prisma, SlotApplicationStatus } from "@prisma/client";
import { AdminNav } from "@/components/admin-nav";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

type ApplicationsPageProps = {
  searchParams?: Promise<{ email?: string; slot?: string; status?: string }>;
};

const statusOptions = Object.values(SlotApplicationStatus);

const inputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const buttonClassName =
  "rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
const deleteButtonClassName =
  "rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-500";

function normalizeTextValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isStatus(value: string): value is SlotApplicationStatus {
  return statusOptions.includes(value as SlotApplicationStatus);
}

function slotLabel(slot: { startsAt: Date; endsAt: Date; venue: { name: string } }): string {
  return `${slot.venue.name} | ${slot.startsAt.toLocaleString()} - ${slot.endsAt.toLocaleString()}`;
}

function parsePreferenceRank(rawValue: string): number | null {
  const parsed = Number.parseInt(rawValue, 10);
  return parsed >= 1 && parsed <= 3 ? parsed : null;
}

async function createApplicationAction(formData: FormData) {
  "use server";

  await requireAdminSession();

  const submissionId = normalizeTextValue(formData, "submissionId");
  const slotId = normalizeTextValue(formData, "slotId");
  const preferenceRankRaw = normalizeTextValue(formData, "preferenceRank");
  const preferenceRank = parsePreferenceRank(preferenceRankRaw);
  const statusRaw = normalizeTextValue(formData, "status");
  const status = isStatus(statusRaw) ? statusRaw : SlotApplicationStatus.APPLIED;

  if (!submissionId || !slotId || !preferenceRank) {
    return;
  }

  try {
    await prisma.submissionSlot.create({
      data: {
        submissionId,
        slotId,
        preferenceRank,
        status
      }
    });
    revalidatePath("/admin/applications");
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }
    throw error;
  }
}

async function updateApplicationAction(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = normalizeTextValue(formData, "id");
  const submissionId = normalizeTextValue(formData, "submissionId");
  const slotId = normalizeTextValue(formData, "slotId");
  const preferenceRankRaw = normalizeTextValue(formData, "preferenceRank");
  const preferenceRank = parsePreferenceRank(preferenceRankRaw);
  const statusRaw = normalizeTextValue(formData, "status");
  const status = isStatus(statusRaw) ? statusRaw : null;

  if (!id || !submissionId || !slotId || !preferenceRank || !status) {
    return;
  }

  try {
    const didUpdate = await prisma.$transaction(async (tx) => {
      const current = await tx.submissionSlot.findUnique({
        where: { id },
        select: {
          id: true,
          submissionId: true,
          preferenceRank: true
        }
      });

      if (!current) {
        return false;
      }

      const rankConflict = await tx.submissionSlot.findFirst({
        where: {
          submissionId,
          preferenceRank,
          NOT: {
            id
          }
        },
        select: {
          id: true
        }
      });

      // If moving this row into an occupied rank within the same submission,
      // swap ranks safely using a temporary rank inside one transaction.
      if (
        rankConflict &&
        current.submissionId === submissionId &&
        current.preferenceRank !== preferenceRank
      ) {
        let temporaryRank = 1000;
        while (
          await tx.submissionSlot.findFirst({
            where: {
              submissionId,
              preferenceRank: temporaryRank
            },
            select: { id: true }
          })
        ) {
          temporaryRank += 1;
        }

        await tx.submissionSlot.update({
          where: { id },
          data: {
            preferenceRank: temporaryRank
          }
        });

        await tx.submissionSlot.update({
          where: { id: rankConflict.id },
          data: {
            preferenceRank: current.preferenceRank
          }
        });
      } else if (rankConflict) {
        // Cross-submission move into an occupied rank is invalid.
        return false;
      }

      await tx.submissionSlot.update({
        where: { id },
        data: {
          submissionId,
          slotId,
          preferenceRank,
          status
        }
      });

      return true;
    });
    if (didUpdate) {
      revalidatePath("/admin/applications");
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }
    throw error;
  }
}

async function deleteApplicationAction(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = normalizeTextValue(formData, "id");
  if (!id) {
    return;
  }

  await prisma.submissionSlot.delete({
    where: { id }
  });
  revalidatePath("/admin/applications");
}

export default async function AdminApplicationsPage({ searchParams }: ApplicationsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const emailFilter = params?.email?.trim() ?? "";
  const slotFilter = params?.slot?.trim() ?? "";
  const statusRaw = params?.status?.trim() ?? "";
  const statusFilter = isStatus(statusRaw) ? statusRaw : "";

  const [submissions, slots, applications] = await Promise.all([
    prisma.submission.findMany({
      select: {
        id: true,
        email: true
      },
      orderBy: {
        email: "asc"
      }
    }),
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
            email: true
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

        <form action={createApplicationAction} className="mt-6 grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-5">
          <select className={inputClassName} name="submissionId" required>
            <option value="">Select submission</option>
            {submissions.map((submission) => (
              <option key={submission.id} value={submission.id}>
                {submission.email}
              </option>
            ))}
          </select>
          <select className={inputClassName} name="slotId" required>
            <option value="">Select slot</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slotLabel(slot)}
              </option>
            ))}
          </select>
          <input
            className={inputClassName}
            defaultValue="1"
            max={3}
            min={1}
            name="preferenceRank"
            required
            type="number"
          />
          <select className={inputClassName} defaultValue={SlotApplicationStatus.APPLIED} name="status" required>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div className="md:text-right">
            <button className={buttonClassName} type="submit">
              Create
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">Submission Email</th>
                <th className="px-2 py-2">Venue</th>
                <th className="px-2 py-2">Slot Time</th>
                <th className="px-2 py-2">Preference Rank</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Applied At</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr className="border-b border-slate-100 align-top" key={application.id}>
                  <td className="px-2 py-3">{application.submission.email}</td>
                  <td className="px-2 py-3">{application.slot.venue.name}</td>
                  <td className="px-2 py-3">
                    {application.slot.startsAt.toLocaleString()} - {application.slot.endsAt.toLocaleString()}
                  </td>
                  <td className="px-2 py-3">{application.preferenceRank}</td>
                  <td className="px-2 py-3">{application.status}</td>
                  <td className="px-2 py-3">{application.appliedAt.toLocaleString()}</td>
                  <td className="px-2 py-3">
                    <div className="flex min-w-[820px] items-start gap-2">
                      <form action={updateApplicationAction} className="flex flex-wrap items-center gap-2">
                        <input name="id" type="hidden" value={application.id} />
                        <select
                          className={inputClassName}
                          defaultValue={application.submissionId}
                          name="submissionId"
                          required
                        >
                          {submissions.map((submission) => (
                            <option key={submission.id} value={submission.id}>
                              {submission.email}
                            </option>
                          ))}
                        </select>
                        <select className={inputClassName} defaultValue={application.slotId} name="slotId" required>
                          {slots.map((slot) => (
                            <option key={slot.id} value={slot.id}>
                              {slotLabel(slot)}
                            </option>
                          ))}
                        </select>
                        <input
                          className={inputClassName}
                          defaultValue={application.preferenceRank}
                          max={3}
                          min={1}
                          name="preferenceRank"
                          required
                          type="number"
                        />
                        <select className={inputClassName} defaultValue={application.status} name="status" required>
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button className={secondaryButtonClassName} type="submit">
                          Edit
                        </button>
                      </form>

                      <form action={deleteApplicationAction}>
                        <input name="id" type="hidden" value={application.id} />
                        <ConfirmSubmitButton className={deleteButtonClassName}>Delete</ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {applications.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={7}>
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
