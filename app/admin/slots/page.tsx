import { revalidatePath } from "next/cache";
import { SlotState } from "@prisma/client";
import { AdminNav } from "@/components/admin-nav";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

type SlotsPageProps = {
  searchParams?: Promise<{ venue?: string; state?: string }>;
};

const slotStateOptions = Object.values(SlotState);

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

function isSlotState(value: string): value is SlotState {
  return slotStateOptions.includes(value as SlotState);
}

function parseDateTimeLocal(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateTimeInputValue(date: Date): string {
  const localTimestamp = date.getTime() - date.getTimezoneOffset() * 60 * 1000;
  return new Date(localTimestamp).toISOString().slice(0, 16);
}

async function createSlotAction(formData: FormData) {
  "use server";

  await requireAdminSession();

  const venueId = normalizeTextValue(formData, "venueId");
  const applicationBegin = parseDateTimeLocal(normalizeTextValue(formData, "applicationBegin"));
  const applicationDeadline = parseDateTimeLocal(normalizeTextValue(formData, "applicationDeadline"));
  const state = normalizeTextValue(formData, "state");
  const startsAt = parseDateTimeLocal(normalizeTextValue(formData, "startsAt"));
  const endsAt = parseDateTimeLocal(normalizeTextValue(formData, "endsAt"));

  if (
    !venueId ||
    !applicationBegin ||
    !applicationDeadline ||
    !startsAt ||
    !endsAt ||
    !isSlotState(state) ||
    endsAt <= startsAt ||
    applicationDeadline <= applicationBegin
  ) {
    return;
  }

  await prisma.slot.create({
    data: {
      venueId,
      applicationBegin,
      applicationDeadline,
      startsAt,
      endsAt,
      state
    }
  });
  revalidatePath("/admin/slots");
}

async function updateSlotAction(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = normalizeTextValue(formData, "id");
  const venueId = normalizeTextValue(formData, "venueId");
  const applicationBegin = parseDateTimeLocal(normalizeTextValue(formData, "applicationBegin"));
  const applicationDeadline = parseDateTimeLocal(normalizeTextValue(formData, "applicationDeadline"));
  const state = normalizeTextValue(formData, "state");
  const startsAt = parseDateTimeLocal(normalizeTextValue(formData, "startsAt"));
  const endsAt = parseDateTimeLocal(normalizeTextValue(formData, "endsAt"));

  if (
    !id ||
    !venueId ||
    !applicationBegin ||
    !applicationDeadline ||
    !startsAt ||
    !endsAt ||
    !isSlotState(state) ||
    endsAt <= startsAt ||
    applicationDeadline <= applicationBegin
  ) {
    return;
  }

  await prisma.slot.update({
    where: { id },
    data: {
      venueId,
      applicationBegin,
      applicationDeadline,
      startsAt,
      endsAt,
      state
    }
  });
  revalidatePath("/admin/slots");
}

async function deleteSlotAction(formData: FormData) {
  "use server";

  await requireAdminSession();

  const id = normalizeTextValue(formData, "id");
  if (!id) {
    return;
  }

  await prisma.slot.delete({
    where: { id }
  });
  revalidatePath("/admin/slots");
}

export default async function AdminSlotsPage({ searchParams }: SlotsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const venueFilter = params?.venue?.trim() ?? "";
  const stateFilterRaw = params?.state?.trim() ?? "";
  const stateFilter = isSlotState(stateFilterRaw) ? stateFilterRaw : "";

  const [venues, slots] = await Promise.all([
    prisma.venue.findMany({
      orderBy: {
        name: "asc"
      }
    }),
    prisma.slot.findMany({
      where: {
        ...(venueFilter ? { venueId: venueFilter } : {}),
        ...(stateFilter ? { state: stateFilter } : {})
      },
      include: {
        venue: true
      },
      orderBy: {
        startsAt: "asc"
      }
    })
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <AdminNav active="slots" />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Slots</h1>

        <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-venue">
              Venue
            </label>
            <select className={inputClassName} defaultValue={venueFilter} id="filter-venue" name="venue">
              <option value="">All venues</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-state">
              State
            </label>
            <select className={inputClassName} defaultValue={stateFilter} id="filter-state" name="state">
              <option value="">All states</option>
              {slotStateOptions.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <button className={secondaryButtonClassName} type="submit">
            Search
          </button>
        </form>

        <form action={createSlotAction} className="mt-6 grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-7">
          <select className={inputClassName} name="venueId" required>
            <option value="">Select venue</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
          <input className={inputClassName} name="applicationBegin" required type="datetime-local" />
          <input className={inputClassName} name="applicationDeadline" required type="datetime-local" />
          <input className={inputClassName} name="startsAt" required type="datetime-local" />
          <input className={inputClassName} name="endsAt" required type="datetime-local" />
          <select className={inputClassName} defaultValue={SlotState.ACCEPTING_APPLICATIONS} name="state" required>
            {slotStateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
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
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">Venue</th>
                <th className="px-2 py-2">Application Begin</th>
                <th className="px-2 py-2">Application Deadline</th>
                <th className="px-2 py-2">Starts At</th>
                <th className="px-2 py-2">Ends At</th>
                <th className="px-2 py-2">State</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr className="border-b border-slate-100 align-top" key={slot.id}>
                  <td className="px-2 py-3 font-mono text-xs">{slot.id}</td>
                  <td className="px-2 py-3">{slot.venue.name}</td>
                  <td className="px-2 py-3">{slot.applicationBegin.toLocaleString()}</td>
                  <td className="px-2 py-3">{slot.applicationDeadline.toLocaleString()}</td>
                  <td className="px-2 py-3">{slot.startsAt.toLocaleString()}</td>
                  <td className="px-2 py-3">{slot.endsAt.toLocaleString()}</td>
                  <td className="px-2 py-3">{slot.state}</td>
                  <td className="px-2 py-3">
                    <div className="flex min-w-[860px] items-start gap-2">
                      <form action={updateSlotAction} className="flex flex-wrap items-center gap-2">
                        <input name="id" type="hidden" value={slot.id} />
                        <select className={inputClassName} defaultValue={slot.venueId} name="venueId" required>
                          {venues.map((venue) => (
                            <option key={venue.id} value={venue.id}>
                              {venue.name}
                            </option>
                          ))}
                        </select>
                        <input
                          className={inputClassName}
                          defaultValue={toDateTimeInputValue(slot.applicationBegin)}
                          name="applicationBegin"
                          required
                          type="datetime-local"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={toDateTimeInputValue(slot.applicationDeadline)}
                          name="applicationDeadline"
                          required
                          type="datetime-local"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={toDateTimeInputValue(slot.startsAt)}
                          name="startsAt"
                          required
                          type="datetime-local"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={toDateTimeInputValue(slot.endsAt)}
                          name="endsAt"
                          required
                          type="datetime-local"
                        />
                        <select className={inputClassName} defaultValue={slot.state} name="state" required>
                          {slotStateOptions.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                        <button className={secondaryButtonClassName} type="submit">
                          Edit
                        </button>
                      </form>

                      <form action={deleteSlotAction}>
                        <input name="id" type="hidden" value={slot.id} />
                        <ConfirmSubmitButton className={deleteButtonClassName}>Delete</ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {slots.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={8}>
                    No slots found.
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
