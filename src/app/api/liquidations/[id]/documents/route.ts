import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { LiquidationReportPdf } from "@/lib/pdf/LiquidationReportPdf";
import { CertificationPdf } from "@/lib/pdf/CertificationPdf";
import { AcknowledgementReceiptPdf } from "@/lib/pdf/AcknowledgementReceiptPdf";
import { TypeOfExpensesPdf } from "@/lib/pdf/TypeOfExpensesPdf";
import { buildTypeOfExpensesExcel } from "@/lib/pdf/typeOfExpensesExcel";
import { buildFilename } from "@/lib/pdf/filename";
import type {
  LiquidationPdfData,
  CertificationPdfData,
  AcknowledgementReceiptPdfData,
  PdfExpenseCategory,
  PdfCertificationEntry,
  PdfAcknowledgementReceipt,
} from "@/lib/pdf/types";

type DocType = "liquidation" | "certification" | "acknowledgement" | "expenses-pdf" | "expenses-excel";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const docType = req.nextUrl.searchParams.get("type") as DocType | null;
  if (!docType) return NextResponse.json({ error: "Missing type" }, { status: 400 });

  // Fetch the full liquidation
  const liq = await db.liquidation.findUnique({
    where: { id, deleted_at: null },
    include: {
      office: true,
      created_by_user: true,
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

  if (!liq) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Office-scope check for Encoders
  if (session.user.role === "Encoder" && liq.office_id !== session.user.officeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build shared category data
  const categories: PdfExpenseCategory[] = liq.expense_categories.map((cat) => ({
    name: cat.name,
    approvedBudgetAmount: Number(cat.approved_budget_amount),
    items: cat.expense_items.map((item) => ({
      payee: item.payee,
      amount: Number(item.amount),
      docType: item.doc_type as "receipt" | "certification" | "acknowledgement_receipt",
      docReference: item.doc_reference,
    })),
  }));

  const totalActual = categories.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.amount, 0), 0);
  const totalApproved = categories.reduce((s, c) => s + c.approvedBudgetAmount, 0);
  const totalVariance = totalApproved - totalActual;
  const returnedAmount = totalActual <= totalApproved ? totalVariance : null;
  const excessAmount = totalActual > totalApproved ? totalActual - totalApproved : null;

  const liqDate = formatDate(liq.date);
  const liqIso = isoDate(liq.date);
  const prNumber = liq.pr_number;

  const liquidationData: LiquidationPdfData = {
    prNumber,
    payerName: liq.payer_name,
    date: liqDate,
    projectName: liq.project_name,
    collegeDept: liq.college_dept,
    approvedBudgetTotal: Number(liq.approved_budget_total),
    cvCdvNumber: liq.cv_cdv_number,
    cvCdvDate: liq.cv_cdv_date ? formatDate(liq.cv_cdv_date) : null,
    claimantName: liq.claimant_name,
    deanHeadName: liq.dean_head_name,
    officeName: liq.office.name,
    categories,
    totalActual,
    totalApproved,
    totalVariance: Math.abs(totalVariance),
    returnedAmount,
    excessAmount,
  };

  if (docType === "liquidation") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buf = await renderToBuffer(React.createElement(LiquidationReportPdf, { data: liquidationData }) as any);
    const filename = buildFilename("LIQ", prNumber, liqIso, "pdf");
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (docType === "expenses-pdf") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buf = await renderToBuffer(React.createElement(TypeOfExpensesPdf, { data: liquidationData }) as any);
    const filename = buildFilename("EXPENSE", prNumber, liqIso, "pdf");
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (docType === "expenses-excel") {
    const buf = buildTypeOfExpensesExcel(liquidationData);
    const filename = buildFilename("EXPENSE", prNumber, liqIso, "xlsx");
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (docType === "certification") {
    const entries: PdfCertificationEntry[] = liq.expense_categories.flatMap((cat) =>
      cat.expense_items
        .filter((i) => i.doc_type === "certification" && i.certification_entry)
        .map((i) => ({
          payee: i.payee,
          amount: Number(i.amount),
          categoryName: cat.name,
          reason: i.certification_entry!.reason,
        })),
    );

    if (entries.length === 0) {
      return NextResponse.json({ error: "No certification entries for this liquidation." }, { status: 404 });
    }

    // Aggregate purpose — use the first unique reason; if multiple, join them
    const uniqueReasons = [...new Set(entries.map((e) => e.reason))];
    const purpose = uniqueReasons.join(" ");

    const certData: CertificationPdfData = {
      prNumber,
      payerName: liq.payer_name,
      date: liqDate,
      projectName: liq.project_name,
      collegeDept: liq.college_dept,
      approvedBudgetTotal: Number(liq.approved_budget_total),
      cvCdvNumber: liq.cv_cdv_number,
      cvCdvDate: liq.cv_cdv_date ? formatDate(liq.cv_cdv_date) : null,
      claimantName: liq.claimant_name,
      deanHeadName: liq.dean_head_name,
      entries,
      totalAmount: entries.reduce((s, e) => s + e.amount, 0),
      purpose,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buf = await renderToBuffer(React.createElement(CertificationPdf, { data: certData }) as any);
    const filename = buildFilename("CERT", prNumber, liqIso, "pdf");
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (docType === "acknowledgement") {
    const receipts: PdfAcknowledgementReceipt[] = liq.expense_categories.flatMap((cat) =>
      cat.expense_items
        .filter((i) => i.doc_type === "acknowledgement_receipt" && i.acknowledgement_receipt)
        .map((i) => {
          const ar = i.acknowledgement_receipt!;
          return {
            id: ar.id,
            payee: i.payee,
            amount: Number(i.amount),
            amountInWords: ar.amount_in_words,
            reasonText: ar.reason_text,
            eventName: ar.event_name,
            eventDates: ar.event_dates,
            venue: ar.venue,
          };
        }),
    );

    if (receipts.length === 0) {
      return NextResponse.json({ error: "No acknowledgement receipts for this liquidation." }, { status: 404 });
    }

    const arData: AcknowledgementReceiptPdfData = {
      officeName: liq.office.name,
      receipts,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buf = await renderToBuffer(React.createElement(AcknowledgementReceiptPdf, { data: arData }) as any);
    const filename = buildFilename("AR", prNumber, liqIso, "pdf");
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
