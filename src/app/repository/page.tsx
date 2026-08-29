import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { AppShell } from "@/components/AppShell";
import { RepositoryExportButton } from "@/components/repository/RepositoryExportButton";
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

export default async function RepositoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    office?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") redirect("/pending-approval");

  const { q, status, office, from, to } = await searchParams;
  const isAdmin = session.user.role === "Admin";

  const offices = isAdmin
    ? await db.office.findMany({ select: { id: true, name: true, short_code: true }, orderBy: { name: "asc" } })
    : [];

  const liquidations = await db.liquidation.findMany({
    where: {
      deleted_at: null,
      // Encoders scoped to their office; Admins can filter by office dropdown
      office_id: isAdmin
        ? office ? office : undefined
        : session.user.officeId ?? "",
      ...(status ? { status: status as never } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to   ? { lte: new Date(to)   } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { pr_number:    { contains: q, mode: "insensitive" } },
              { project_name: { contains: q, mode: "insensitive" } },
              { payer_name:   { contains: q, mode: "insensitive" } },
              { claimant_name:{ contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      office: { select: { short_code: true, name: true } },
      expense_categories: {
        include: { expense_items: { select: { amount: true } } },
      },
    },
    orderBy: [{ date: "desc" }, { created_at: "desc" }],
  });

  // Compute actuals
  const rows = liquidations.map((liq) => {
    const totalActual = liq.expense_categories.reduce(
      (s, c) => s + c.expense_items.reduce((ss, i) => ss + Number(i.amount), 0),
      0,
    );
    return { ...liq, totalActual };
  });

  // Serialize for export button (plain objects, no Decimal/Date)
  const exportData = rows.map((r) => ({
    id:                   r.id,
    office:               r.office.name,
    officeCode:           r.office.short_code,
    prNumber:             r.pr_number,
    projectName:          r.project_name,
    payerName:            r.payer_name,
    date:                 r.date.toISOString().slice(0, 10),
    approvedBudgetTotal:  Number(r.approved_budget_total),
    totalActual:          r.totalActual,
    status:               r.status,
  }));

  return (
    <AppShell activePath="/repository">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Repository</h1>
          <p className="text-sm text-ink/50">
            {isAdmin ? "All offices" : "Your office"} — {rows.length} liquidation{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <RepositoryExportButton data={exportData} />
      </div>

      {/* Filters */}
      <form method="GET" className="mb-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search PR No., project, payer…"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:border-maroon focus:outline-none focus:ring-1 focus:ring-gold"
        />

        {isAdmin && (
          <select
            name="office"
            defaultValue={office ?? ""}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink focus:border-maroon focus:outline-none"
          >
            <option value="">All offices</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>{o.short_code}</option>
            ))}
          </select>
        )}

        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-ink focus:border-maroon focus:outline-none"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink focus:border-maroon focus:outline-none"
          />
          <span className="text-xs text-ink/40">to</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink focus:border-maroon focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-maroon/10 px-3 py-1.5 text-sm font-medium text-maroon hover:bg-maroon/20"
        >
          Filter
        </button>
        {(q || status || office || from || to) && (
          <Link href="/repository" className="rounded-md px-3 py-1.5 text-sm text-ink/50 hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <p className="text-sm text-ink/50">No liquidations match your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-[#f8f7f5] text-xs font-semibold uppercase tracking-wide text-ink/40">
              <tr>
                {isAdmin && <th className="px-4 py-3 text-left">Office</th>}
                <th className="px-4 py-3 text-left">PR No.</th>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left">Payer</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Approved</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Variance</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((liq) => {
                const approved = Number(liq.approved_budget_total);
                const actual   = liq.totalActual;
                const variance = approved - actual;
                return (
                  <tr key={liq.id} className="hover:bg-[#f8f7f5]">
                    {isAdmin && (
                      <td className="px-4 py-3 text-xs font-medium text-ink/60">
                        {liq.office.short_code}
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-xs text-ink/70">{liq.pr_number}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium text-ink">
                      {liq.project_name}
                    </td>
                    <td className="px-4 py-3 text-ink/70">{liq.payer_name}</td>
                    <td className="px-4 py-3 text-ink/60">
                      {liq.date.toLocaleDateString("en-PH", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-ink/70">
                      ₱{approved.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-ink/70">
                      {actual === 0 ? "-" : `₱${actual.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-xs ${variance < 0 ? "text-red-600" : "text-green-700"}`}>
                      {actual === 0 ? "-" : `₱${Math.abs(variance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
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

            {/* Summary footer */}
            <tfoot className="border-t-2 border-border bg-[#f8f7f5] text-xs font-semibold text-ink/60">
              <tr>
                {isAdmin && <td className="px-4 py-2" />}
                <td colSpan={4} className="px-4 py-2">
                  {rows.length} records
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  ₱{rows.reduce((s, r) => s + Number(r.approved_budget_total), 0)
                    .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  ₱{rows.reduce((s, r) => s + r.totalActual, 0)
                    .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  ₱{Math.abs(
                    rows.reduce((s, r) => s + Number(r.approved_budget_total), 0) -
                    rows.reduce((s, r) => s + r.totalActual, 0)
                  ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </td>
                <td colSpan={2} className="px-4 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </AppShell>
  );
}
