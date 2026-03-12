import { ApplicationForm } from "@/components/application-form";

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
  const params = await searchParams;
  const verifiedStatus = params?.verified;
  const verificationMessage = verifiedStatus
    ? verificationMessages[verifiedStatus] ?? "Verification status is unknown."
    : null;

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
          Submit your details. A verification email will be sent after submission.
        </p>
        <ApplicationForm />
      </section>
    </main>
  );
}
