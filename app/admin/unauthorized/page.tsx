import { AdminSignOutButton } from "@/components/admin-sign-out-button";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/app/admin/login/login-form";
import { getCurrentAdminAuthorization } from "@/lib/admin-page-access";

export default async function AdminUnauthorizedPage() {
  const authorization = await getCurrentAdminAuthorization();

  if (authorization.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (authorization.status === "authorized") {
    redirect("/admin");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <section className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          Signed in as <span className="font-medium text-slate-900">{authorization.normalizedEmail}</span>, but
          this email is not in the admin allowlist.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Ask an existing administrator to add this address in the database, then sign in again.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <AdminLoginForm buttonLabel="Try another Google account" />
          <AdminSignOutButton className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60" />
        </div>
      </section>
    </main>
  );
}
