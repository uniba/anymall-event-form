import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { getGenderLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

type SubmissionsPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

const inputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

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

export default async function AdminSubmissionsPage({ searchParams }: SubmissionsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const submissions = await prisma.submission.findMany({
    where: query
      ? {
          OR: [
            {
              email: {
                contains: query,
                mode: "insensitive"
              }
            },
            {
              name: {
                contains: query,
                mode: "insensitive"
              }
            }
          ]
        }
      : undefined,
    orderBy: {
      createdAt: "desc"
    }
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <AdminNav active="submissions" />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">申込一覧</h1>

        <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="search-email-name">
              メールアドレスまたは名前を検索
            </label>
            <input
              className={inputClassName}
              defaultValue={query}
              id="search-email-name"
              name="q"
              placeholder="Email or name"
              type="text"
            />
          </div>
          <button className={secondaryButtonClassName} type="submit">
            検索
          </button>
        </form>

        <div className="mt-6">
          <p className="mb-1 block text-xs font-medium text-slate-600">
            申込件数: {submissions.length}
          </p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">名前</th>
                <th className="px-2 py-2">メーイル</th>
                <th className="px-2 py-2">性別</th>
                <th className="px-2 py-2">年齢</th>
                <th className="px-2 py-2">申込日時</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr className="border-b border-slate-100 align-top" key={submission.id}>
                  <td className="px-2 py-3">{submission.name}</td>
                  <td className="px-2 py-3">{submission.email}</td>
                  <td className="px-2 py-3">{getGenderLabel(submission.gender)}</td>
                  <td className="px-2 py-3">{calculateAge(submission.birthday)}</td>
                  <td className="px-2 py-3">{submission.createdAt.toLocaleString()}</td>
                </tr>
              ))}
              {submissions.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={5}>
                    申込はありません
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
