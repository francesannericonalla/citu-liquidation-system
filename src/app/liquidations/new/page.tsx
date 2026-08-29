import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LiquidationHeaderForm } from "@/components/liquidations/LiquidationHeaderForm";
import { db } from "@/lib/db/client";

export default async function NewLiquidationPage() {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") redirect("/pending-approval");

  // Pre-fill college/dept from office name
  const office = session.user.officeId
    ? await db.office.findUnique({ where: { id: session.user.officeId }, select: { name: true } })
    : null;

  return (
    <AppShell activePath="/liquidations">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">New Liquidation</h1>
        <p className="text-sm text-ink/50">Fill in the liquidation details. You can add expense items after saving.</p>
      </div>
      <LiquidationHeaderForm defaultCollegeDept={office?.name ?? ""} />
    </AppShell>
  );
}
