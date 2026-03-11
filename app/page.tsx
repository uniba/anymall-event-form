import { SlotState } from "@prisma/client";
import { ApplicationForm } from "@/components/application-form";
import { prisma } from "@/lib/prisma";

type HomePageProps = {
  searchParams?: Promise<{ verified?: string }>;
};

const verificationMessages: Record<string, string> = {
  success: "Your email is verified.",
  invalid_token: "The verification link is invalid.",
  expired_token: "This verification link has expired. Please submit the form again.",
  missing_token: "No verification token was provided.",
  already_verified: "Your email was already verified.",
  error: "Verification failed due to a server error."
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const now = new Date();
  const params = await searchParams;
  const verifiedStatus = params?.verified;
  const verificationMessage = verifiedStatus
    ? verificationMessages[verifiedStatus] ?? "Verification status is unknown."
    : null;
  const slots = await prisma.slot.findMany({
    where: {
      state: SlotState.ACCEPTING_APPLICATIONS,
      applicationBegin: {
        lte: now
      },
      applicationDeadline: {
        gte: now
      }
    },
    include: {
      venue: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      startsAt: "asc"
    }
  });

  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const slotOptions = slots.map((slot) => ({
    id: slot.id,
    label: `${slot.venue.name} — ${dayFormatter.format(slot.startsAt)}, ${timeFormatter.format(slot.startsAt)}–${timeFormatter.format(slot.endsAt)}`
  }));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {verificationMessage ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {verificationMessage}
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Application Form</h1>
        <p className="mt-2 text-sm text-slate-600">
          Submit your details and up to three preferred slots. A verification email will be sent after submission.
        </p>
        <ApplicationForm slotOptions={slotOptions} />
      </section>
    </main>
  );
}
