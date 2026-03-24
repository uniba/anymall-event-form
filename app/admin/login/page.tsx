import { redirect } from "next/navigation";
import { getCurrentAdminAuthorization } from "@/lib/admin-page-access";
import { AdminLoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const authorization = await getCurrentAdminAuthorization();

  if (authorization.status === "authorized") {
    redirect("/admin");
  }

  if (authorization.status === "unauthorized") {
    redirect("/admin/unauthorized");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-900">管理者ログイン</h1>
        <p className="text-center mt-2 text-sm text-slate-600">
          承認済みの Google アカウントでサインインして、管理ダッシュボードにアクセスしてください。
        </p>

        <AdminLoginForm />
      </section>
    </main>
  );
}
