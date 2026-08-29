import * as XLSX from "xlsx";
import type { LiquidationPdfData } from "./types";

function pesoStr(n: number): string {
  if (n === 0) return "-";
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function docLabel(item: { docType: string; docReference: string | null }): string {
  if (item.docType === "certification") return "Certification";
  if (item.docType === "acknowledgement_receipt") return "Acknowledgement Receipt";
  return item.docReference ?? "";
}

export function buildTypeOfExpensesExcel(data: LiquidationPdfData): Buffer {
  const wb = XLSX.utils.book_new();

  // Title rows
  const rows: (string | number)[][] = [
    ["TYPE OF EXPENSES"],
    [`${data.projectName} | ${data.collegeDept}`],
    [`PR No. ${data.prNumber} | ${data.date}`],
    [],
    ["PAYEE", "SUPPORTING DOCUMENTS", "AMOUNT"],
  ];

  for (const cat of data.categories) {
    // Category header
    rows.push([cat.name.toUpperCase(), "", ""]);

    for (const item of cat.items) {
      rows.push([item.payee, docLabel(item), item.amount]);
    }

    const subtotal = cat.items.reduce((s, i) => s + i.amount, 0);
    rows.push([`Subtotal — ${cat.name}`, "", subtotal]);
    rows.push([]);
  }

  const grandTotal = data.categories.reduce(
    (s, c) => s + c.items.reduce((ss, i) => ss + i.amount, 0),
    0,
  );
  rows.push(["GRAND TOTAL", "", grandTotal]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [{ wch: 40 }, { wch: 28 }, { wch: 16 }];

  // Merge title cells across 3 columns for the first 3 rows
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Type of Expenses");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buf;
}
