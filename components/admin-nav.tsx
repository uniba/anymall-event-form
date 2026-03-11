import Link from "next/link";

type AdminNavProps = {
  active?: "dashboard" | "submissions" | "applications" | "venues" | "slots" | "lottery";
};

function navLinkClass(isActive: boolean): string {
  return [
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
  ].join(" ");
}

export function AdminNav({ active }: AdminNavProps) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <nav className="flex flex-wrap items-center gap-2">
        <Link className={navLinkClass(active === "dashboard")} href="/admin">
          Dashboard
        </Link>
        <Link className={navLinkClass(active === "submissions")} href="/admin/submissions">
          Submissions
        </Link>
        <Link className={navLinkClass(active === "applications")} href="/admin/applications">
          Applications
        </Link>
        <Link className={navLinkClass(active === "venues")} href="/admin/venues">
          Venues
        </Link>
        <Link className={navLinkClass(active === "slots")} href="/admin/slots">
          Slots
        </Link>
        <Link className={navLinkClass(active === "lottery")} href="/admin/lottery">
          Lottery
        </Link>
      </nav>

      <form action="/api/admin/logout" method="post">
        <button
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          type="submit"
        >
          Logout
        </button>
      </form>
    </header>
  );
}
