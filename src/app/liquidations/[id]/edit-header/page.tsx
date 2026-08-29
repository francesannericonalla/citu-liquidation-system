import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { AppShell } from "@/components/AppShell";
import { LiquidationHeaderForm } from "@/components/liquidations/LiquidationHeaderForm";
import Link from "next/link";

export default async function EditHeaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") redirect("/pending-approval");

  const { id } = await params;

  const liq = await db.liquidation.findUnique({
    where: { id, deleted_at: null },
    select: {
      id: true, pr_number: true, payer_name: true, date: true,
      project_name: true, college_dept: true, approved_budget_total: true,
      cv_cdv_number: true, cv_cdv_date: true, claimant_name: true,
      dean_head_name: true, office_id: true,
    },
  });

  if (!liq) notFound();
  if (session.user.role === "Encoder" && liq.office_id !== session.user.officeId) notFound();

  return (
    <AppShell activePath="/liquidations">
      <div className="mb-1 flex items-center gap-2 text-xs text-ink/40">
        <Link href="/liquidations" className="hover:text-maroon">Liquidations</Link>
        <span>/</span>
        <Link href={`/liquidations/${id}`} className="hover:text-maroon">{liq.pr_number}</Link>
        <span>/</span>
        <span className="text-ink/60">Edit Details</span>
      </div>
      <div className="mb-6 mt-2">
        <h1 className="text-xl font-semibold text-ink">Edit Liquidation Details</h1>
      </div>
      <LiquidationHeaderForm
        existing={{
          id: liq.id,
          prNumber: liq.pr_number,
          payerName: liq.payer_name,
          date: liq.date.toISOString().slice(0, 10),
          projectName: liq.project_name,
          collegeDept: liq.college_dept,
          approvedBudgetTotal: Number(liq.approved_budget_total),
          cvCdvNumber: liq.cv_cdv_number ?? "",
          cvCdvDate: liq.cv_cdv_date ? liq.cv_cdv_date.toISOString().slice(0, 10) : "",
          claimantName: liq.claimant_name,
          deanHeadName: liq.dean_head_name,
        }}
      />
    </AppShell>
  );
}
