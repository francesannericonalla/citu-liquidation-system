import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { AppShell } from "@/components/AppShell";
import { DeleteButton } from "@/components/liquidations/DeleteButton";
import { StatusSelect } from "@/components/liquidations/StatusSelect";
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

export default async function LiquidationViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") redirect("/pending-approval");

  const { id } = await params;

  const liq = await db.liquidation.findUnique({
    where: { id, deleted_at: null },
    include: {
      office: { select: { name: true, short_code: true } },
      created_by_user: { select: { name: true } },
      last_edited_by_user: { select: { name: true } },
      expense_categories: {
        orderBy: { sort_order: "asc" },
        include: {
          expense_items: {
            include: {
              certification_entry: true,
              acknowledgement_receipt: true,
            },
          },
        },
      },
    },
  });

  if (!liq) notFound();
  if (session.user.role === "Encoder" && liq.office_id !== session.user.officeId) notFound();

  // Computed values
  const totalActual = liq.expense_categories.reduce(
    (s, c) => s + c.expense_items.reduce((ss, i) => ss + Number(i.amount), 0), 0,
  );
  const totalApproved = liq.expense_categories.reduce((s, c) => s + Number(c.approved_budget_amount), 0);
  const totalVariance = totalApproved - totalActual;
  const isOverBudget = totalActual > Number(liq.approved_budget_total);

  const hasCertification = liq.expense_categories.some((c) =>
    c.expense_items.some((i) => i.doc_type === "certification"),
  );
  const hasAcknowledgement = liq.expense_categories.some((c) =>
    c.expense_items.some((i) => i.doc_type === "acknowledgement_receipt"),
  );

  function peso(n: number) {
    return n === 0 ? "-" : "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const downloadBase = `/api/liquidations/${id}/documents`;

  return (
    <AppShell activePath="/liquidations">
      {/* Breadcrumb */}
      <div className="mb-1 flex items-center gap-2 text-xs text-ink/40">
        <Link href="/liquidations" className="hover:text-maroon">Liquidations</Link>
        <span>/</span>
        <span className="text-ink/60">{liq.pr_number}</span>
      </div>

      {/* Title + actions */}
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">{liq.project_name}</h1>
          <p className="text-sm text-ink/50">
            {liq.pr_number} · {liq.office.name} ·{" "}
            {liq.date.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/liquidations/${id}/edit`}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-[#f8f7f5]"
          >
            Edit Expenses
          </Link>
          <Link
            href={`/liquidations/${id}/edit-header`}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-[#f8f7f5]"
          >
            Edit Details
          </Link>
          <DeleteButton liquidationId={id} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — details + table */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Header fields */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink/40">Liquidation Details</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Payer Name", liq.payer_name],
                ["College / Dept.", liq.college_dept],
                ["Claimant", liq.claimant_name],
                ["Dean / Head", liq.dean_head_name],
                ["CV/CDV No.", liq.cv_cdv_number ?? "—"],
                ["CV/CDV Date", liq.cv_cdv_date
                  ? liq.cv_cdv_date.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
                  : "—"],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs text-ink/40">{label}</dt>
                  <dd className="font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Expense table */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink/40">Expense Categories</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8f7f5] text-xs text-ink/40">
                  <tr>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-right">Approved</th>
                    <th className="px-4 py-2 text-right">Actual</th>
                    <th className="px-4 py-2 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {liq.expense_categories.map((cat) => {
                    const actual = cat.expense_items.reduce((s, i) => s + Number(i.amount), 0);
                    const approved = Number(cat.approved_budget_amount);
                    const variance = approved - actual;
                    return (
                      <tr key={cat.id} className="hover:bg-[#f8f7f5]">
                        <td className="px-4 py-2 font-medium text-ink">{cat.name}</td>
                        <td className="px-4 py-2 text-right font-mono text-xs text-ink/60">{peso(approved)}</td>
                        <td className="px-4 py-2 text-right font-mono text-xs text-ink/60">{peso(actual)}</td>
                        <td className={`px-4 py-2 text-right font-mono text-xs ${variance < 0 ? "text-red-600" : "text-green-700"}`}>
                          {peso(Math.abs(variance))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-border bg-[#f8f7f5] font-semibold">
                  <tr>
                    <td className="px-4 py-2 text-sm">TOTAL</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{peso(totalApproved)}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">{peso(totalActual)}</td>
                    <td className={`px-4 py-2 text-right font-mono text-xs ${totalVariance < 0 ? "text-red-600" : "text-green-700"}`}>
                      {peso(Math.abs(totalVariance))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Items breakdown per category */}
            {liq.expense_categories.map((cat) => (
              cat.expense_items.length > 0 && (
                <div key={cat.id} className="border-t border-border px-5 py-4">
                  <p className="mb-2 text-xs font-semibold text-ink/50">{cat.name.toUpperCase()}</p>
                  <table className="w-full text-xs">
                    <thead className="text-ink/30">
                      <tr>
                        <th className="pb-1 text-left">Payee</th>
                        <th className="pb-1 text-left">Reference</th>
                        <th className="pb-1 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {cat.expense_items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1 text-ink">{item.payee}</td>
                          <td className="py-1 text-ink/50">
                            {item.doc_type === "receipt"
                              ? item.doc_reference
                              : item.doc_type === "certification"
                              ? "Certification"
                              : "Acknowledgement Receipt"}
                          </td>
                          <td className="py-1 text-right font-mono text-ink/70">
                            ₱{Number(item.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Right column — status + downloads */}
        <div className="flex flex-col gap-6">
          {/* Status */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Status</h2>
            <span className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[liq.status]}`}>
              {STATUS_LABELS[liq.status]}
            </span>
            <StatusSelect liquidationId={id} currentStatus={liq.status} />
          </div>

          {/* Summary numbers */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Summary</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/50">Approved Budget</dt>
                <dd className="font-semibold">{peso(Number(liq.approved_budget_total))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/50">Total Actual</dt>
                <dd className={`font-semibold ${isOverBudget ? "text-red-600" : ""}`}>{peso(totalActual)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-medium">{isOverBudget ? "Excess" : "Returned Amount"}</dt>
                <dd className={`font-bold ${isOverBudget ? "text-red-600" : "text-green-700"}`}>
                  {peso(Math.abs(Number(liq.approved_budget_total) - totalActual))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Downloads */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Download Documents</h2>
            <div className="flex flex-col gap-2">
              <a
                href={`${downloadBase}?type=liquidation`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-ink hover:bg-[#f8f7f5]"
              >
                <span>Liquidation Report</span>
                <span className="text-xs text-ink/40">PDF</span>
              </a>
              {hasCertification && (
                <a
                  href={`${downloadBase}?type=certification`}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-ink hover:bg-[#f8f7f5]"
                >
                  <span>Certification</span>
                  <span className="text-xs text-ink/40">PDF</span>
                </a>
              )}
              {hasAcknowledgement && (
                <a
                  href={`${downloadBase}?type=acknowledgement`}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-ink hover:bg-[#f8f7f5]"
                >
                  <span>Acknowledgement Receipts</span>
                  <span className="text-xs text-ink/40">PDF</span>
                </a>
              )}
              <a
                href={`${downloadBase}?type=expenses-pdf`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-ink hover:bg-[#f8f7f5]"
              >
                <span>Type of Expenses</span>
                <span className="text-xs text-ink/40">PDF</span>
              </a>
              <a
                href={`${downloadBase}?type=expenses-excel`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-ink hover:bg-[#f8f7f5]"
              >
                <span>Type of Expenses</span>
                <span className="text-xs text-ink/40">Excel</span>
              </a>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm text-xs text-ink/40">
            <p>Created by {liq.created_by_user.name}</p>
            <p>Last edited by {liq.last_edited_by_user.name}</p>
            <p>{liq.updated_at.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
