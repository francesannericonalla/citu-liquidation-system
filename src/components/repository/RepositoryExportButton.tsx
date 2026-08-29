"use client";

import { useTransition } from "react";

export interface RepositoryRow {
  id: string;
  office: string;
  officeCode: string;
  prNumber: string;
  projectName: string;
  payerName: string;
  date: string;
  approvedBudgetTotal: number;
  totalActual: number;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft:            "Draft",
  generated:        "Generated",
  submitted_to_fao: "Submitted to FAO",
  completed:        "Completed",
};

export function RepositoryExportButton({ data }: { data: RepositoryRow[] }) {
  const [pending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const XLSX = await import("xlsx");

      const sheetData = [
        ["Office", "PR Number", "Project Name", "Payer", "Date", "Approved Budget", "Total Actual", "Variance", "Status"],
        ...data.map((r) => [
          r.office,
          r.prNumber,
          r.projectName,
          r.payerName,
          r.date,
          r.approvedBudgetTotal,
          r.totalActual,
          r.approvedBudgetTotal - r.totalActual,
          STATUS_LABELS[r.status] ?? r.status,
        ]),
        // Totals row
        [
          "TOTAL", "", "", "", "",
          data.reduce((s, r) => s + r.approvedBudgetTotal, 0),
          data.reduce((s, r) => s + r.totalActual, 0),
          data.reduce((s, r) => s + (r.approvedBudgetTotal - r.totalActual), 0),
          "",
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws["!cols"] = [
        { wch: 28 }, { wch: 28 }, { wch: 45 }, { wch: 25 },
        { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Repository");

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `REPOSITORY_${date}.xlsx`);
    });
  }

  return (
    <button
      onClick={handleExport}
      disabled={pending || data.length === 0}
      className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-[#f8f7f5] disabled:opacity-40"
    >
      {pending ? "Exporting…" : "Export Excel"}
    </button>
  );
}
