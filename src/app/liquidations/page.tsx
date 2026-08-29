import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  draft:            "Draft",
  generated:        "Generated",
  submitted_to_fao: "Submitted to FAO",
  completed:        "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  draft:            "bg-gray-100 text-gray-600",
  generated:        "bg-blue-50 text-blue-700",
  submitted_to_fao: "bg-amber-50 text-amber-700",
  completed:        "bg-green-50 text-green-700",
};

export default async function LiquidationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") redirect("/pending-approval");

  const { status: statusFilter, q } = await searchParams;

  const liquidations = await db.liquidation.findMany({
    where: {
      deleted_at: null,
      // Encoders only see their own office
      ...(session.user.role === "Encoder" ? { office_id: session.user.officeId ?? "" } : {}),
      ...(statusFilter ? { status: statusFilter as never } : {}),
      ...(q
        ? {
            OR: [
              { pr_number:    { contains: q, mode: "insensitive" } },
              { project_name: { contains: q, mode: "insensitive" } },
              { payer_name:   { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      office: { select: { short_code: true } },
      expense_categories: { include: { expense_items: { select: { amount: true } } } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <AppShell activePath="/liquidations">
      {/* Header row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Liquidations</h1>
          <p className="text-sm text-ink/50">
            {session.user.role === "Admin" ? "All offices" : "Your office"}
          </p>
        </div>
        <Link
          href="/liquidations/new"
          className="rounded-md bg-maroon px-4 py-2 text-sm font-medium text-white hover:bg-maroon-dark"
        >
          + New Liquidation
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="mb-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search PR No., project, payer…"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:border-maroon focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-ink focus:border-maroon focus:outline-none"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-maroon/10 px-3 py-1.5 text-sm font-medium text-maroon hover:bg-maroon/20"
        >
          Filter
        </button>
        {(q || statusFilter) && (
          <Link href="/liquidations" className="rounded-md px-3 py-1.5 text-sm text-ink/50 hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      {liquidations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <p className="text-sm font-medium text-ink/50">No liquidations found.</p>
          <Link href="/liquidations/new" className="mt-4 text-sm font-medium text-maroon hover:underline">
            Create your first liquidation →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-[#f8f7f5] text-xs font-semibold uppercase text-ink/50">
              <tr>
                {session.user.role === "Admin" && <th className="px-4 py-3 text-left">Office</th>}
                <th className="px-4 py-3 text-left">PR No.</th>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Approved</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {liquidations.map((liq) => {
                const actual = liq.expense_categories.reduce(
                  (s, c) => s + c.expense_items.reduce((ss, i) => ss + Number(i.amount), 0),
                  0,
                );
                return (
                  <tr key={liq.id} className="hover:bg-[#f8f7f5]">
                    {session.user.role === "Admin" && (
                      <td className="px-4 py-3 text-xs text-ink/60">{liq.office.short_code}</td>
                    )}
                    <td className="px-4 py-3 font-mono text-xs text-ink/70">{liq.pr_number}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-ink">
                      {liq.project_name}
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {liq.date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-ink/70">
                      ₱{Number(liq.approved_budget_total).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-ink/70">
                      {actual === 0 ? "-" : `₱${actual.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[liq.status]}`}>
                        {STATUS_LABELS[liq.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/liquidations/${liq.id}`}
                        className="text-xs font-medium text-maroon hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
