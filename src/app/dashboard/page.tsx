import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { AppShell } from "@/components/AppShell";
import { StatusCountCards } from "@/components/dashboard/StatusCountCards";
import { ApprovedVsActualChart } from "@/components/dashboard/ApprovedVsActualChart";
import { SpendByCategoryChart } from "@/components/dashboard/SpendByCategoryChart";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") redirect("/pending-approval");

  const isAdmin = session.user.role === "Admin";
  const officeFilter = isAdmin ? {} : { office_id: session.user.officeId ?? "" };

  // 1. Status counts
  const statusCounts = await db.liquidation.groupBy({
    by: ["status"],
    where: { deleted_at: null, ...officeFilter },
    _count: { status: true },
  });

  const counts = {
    draft:            0,
    generated:        0,
    submitted_to_fao: 0,
    completed:        0,
  } as Record<string, number>;
  for (const row of statusCounts) counts[row.status] = row._count.status;

  // 2. Approved vs actual by office (Admin) or by month (Encoder)
  const liquidations = await db.liquidation.findMany({
    where: { deleted_at: null, ...officeFilter },
    include: {
      office: { select: { short_code: true } },
      expense_categories: {
        include: { expense_items: { select: { amount: true } } },
      },
    },
    orderBy: { date: "asc" },
  });

  // Per-office totals (Admin view)
  const byOffice: Record<string, { approved: number; actual: number }> = {};
  for (const liq of liquidations) {
    const key = liq.office.short_code;
    if (!byOffice[key]) byOffice[key] = { approved: 0, actual: 0 };
    byOffice[key].approved += Number(liq.approved_budget_total);
    byOffice[key].actual   += liq.expense_categories.reduce(
      (s, c) => s + c.expense_items.reduce((ss, i) => ss + Number(i.amount), 0), 0,
    );
  }
  const officeChartData = Object.entries(byOffice).map(([office, v]) => ({ office, ...v }));

  // Per-month totals (last 6 months)
  const monthlyMap: Record<string, { approved: number; actual: number }> = {};
  for (const liq of liquidations) {
    const key = liq.date.toLocaleDateString("en-PH", { year: "numeric", month: "short" });
    if (!monthlyMap[key]) monthlyMap[key] = { approved: 0, actual: 0 };
    monthlyMap[key].approved += Number(liq.approved_budget_total);
    monthlyMap[key].actual   += liq.expense_categories.reduce(
      (s, c) => s + c.expense_items.reduce((ss, i) => ss + Number(i.amount), 0), 0,
    );
  }
  const monthlyChartData = Object.entries(monthlyMap)
    .slice(-6)
    .map(([month, v]) => ({ month, ...v }));

  // 3. Spend by category
  const categoryMap: Record<string, number> = {};
  for (const liq of liquidations) {
    for (const cat of liq.expense_categories) {
      const actual = cat.expense_items.reduce((s, i) => s + Number(i.amount), 0);
      if (actual > 0) {
        categoryMap[cat.name] = (categoryMap[cat.name] ?? 0) + actual;
      }
    }
  }
  const categoryChartData = Object.entries(categoryMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  return (
    <AppShell activePath="/dashboard">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink/50">
          {isAdmin ? "All offices" : "Your office"}
        </p>
      </div>

      {/* Status count cards */}
      <StatusCountCards counts={counts} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Approved vs Actual — by office (Admin) or by month (Encoder) */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            {isAdmin ? "Approved vs Actual by Office" : "Approved vs Actual by Month"}
          </h2>
          <ApprovedVsActualChart
            data={isAdmin ? officeChartData.map(d => ({ label: d.office, approved: d.approved, actual: d.actual }))
                          : monthlyChartData.map(d => ({ label: d.month, approved: d.approved, actual: d.actual }))}
          />
        </div>

        {/* Spend by category */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-ink">Actual Spend by Category</h2>
          <SpendByCategoryChart data={categoryChartData} />
        </div>
      </div>

      {/* Monthly trend (always shown) */}
      {isAdmin && monthlyChartData.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-ink">Monthly Trend</h2>
          <ApprovedVsActualChart data={monthlyChartData.map(d => ({ label: d.month, approved: d.approved, actual: d.actual }))} />
        </div>
      )}
    </AppShell>
  );
}
