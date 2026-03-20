import { Gender } from "@prisma/client";
import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { prefectureOptions } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { calculateAge } from "@/lib/validation";
import { SubmissionsTable, type SubmissionTableRow } from "./submissions-table";

type SubmissionsPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

const inputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

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
              placeholder="メールアドレスまたは名前"
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

        <SubmissionsTable
          genderOptions={Object.values(Gender)}
          prefectureOptions={prefectureOptions}
          submissions={submissions.map(
            (submission): SubmissionTableRow => ({
              id: submission.id,
              name: submission.name,
              furigana: submission.furigana,
              email: submission.email,
              gender: submission.gender,
              age: submission.birthday ? calculateAge(submission.birthday) : null,
              prefecture: submission.prefecture,
              birthday: submission.birthday?.toISOString() ?? "",
              memo: submission.memo,
              createdAt: submission.createdAt.toISOString()
            })
          )}
        />
      </section>
    </main>
  );
}
