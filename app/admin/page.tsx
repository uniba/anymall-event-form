import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";

const cards = [
  {
    href: "/admin/submissions",
    title: "申込一覧",
    description: "申込内容を確認します。"
  },
  {
    href: "/admin/applications",
    title: "応募一覧",
    description: "各スロットへの応募状況を確認します。"
  },
  {
    href: "/admin/venues",
    title: "会場",
    description: "会場名と住所を確認します。"
  },
  {
    href: "/admin/slots",
    title: "スロット",
    description: "開催枠の日時と状態を確認します。"
  },
  {
    href: "/admin/lottery",
    title: "抽選",
    description: "受付終了したスロットの抽選を実行します。"
  }
];

export default async function AdminDashboardPage() {
  await requireAdminSession();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <AdminNav active="dashboard" />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">管理ダッシュボード</h1>
        <p className="mt-2 text-sm text-slate-600">以下の各項目を使用して、記録の確認や抽選の実施を行ってください。</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              href={card.href}
              key={card.href}
            >
              <h2 className="text-base font-medium text-slate-900">{card.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
