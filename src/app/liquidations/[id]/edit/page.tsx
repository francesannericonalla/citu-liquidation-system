import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { AppShell } from "@/components/AppShell";
import { ExpenseEditor } from "@/components/liquidations/ExpenseEditor";
import Link from "next/link";

export default async function EditLiquidationPage({
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
      office: { select: { name: true } },
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

  // Serialize for client
  const initialCategories = liq.expense_categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    approvedBudgetAmount: Number(cat.approved_budget_amount),
    items: cat.expense_items.map((item) => ({
      id: item.id,
      payee: item.payee,
      amount: Number(item.amount),
      docType: item.doc_type as "receipt" | "certification" | "acknowledgement_receipt",
      docReference: item.doc_reference ?? "",
      certReason: item.certification_entry?.reason ?? "",
      arReasonTemplate: (item.acknowledgement_receipt?.reason_template ?? "honorarium") as "honorarium" | "raffle_prize" | "custom",
      arReasonText: item.acknowledgement_receipt?.reason_text ?? "",
      arEventName: item.acknowledgement_receipt?.event_name ?? "",
      arEventDates: item.acknowledgement_receipt?.event_dates ?? "",
      arVenue: item.acknowledgement_receipt?.venue ?? "",
    })),
  }));

  return (
    <AppShell activePath="/liquidations">
      <div className="mb-1 flex items-center gap-2 text-xs text-ink/40">
        <Link href="/liquidations" className="hover:text-maroon">Liquidations</Link>
        <span>/</span>
        <Link href={`/liquidations/${id}`} className="hover:text-maroon">{liq.pr_number}</Link>
        <span>/</span>
        <span className="text-ink/60">Edit Expenses</span>
      </div>

      <div className="mb-6 mt-2">
        <h1 className="text-xl font-semibold text-ink">{liq.project_name}</h1>
        <p className="text-sm text-ink/50">{liq.pr_number} · {liq.office.name}</p>
      </div>

      <ExpenseEditor
        liquidationId={id}
        initialCategories={initialCategories}
        approvedBudgetTotal={Number(liq.approved_budget_total)}
      />
    </AppShell>
  );
}
