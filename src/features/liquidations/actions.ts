"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { LiquidationHeaderSchema } from "@/lib/validators";
import { amountInWords } from "@/lib/pdf/amount-in-words";
import type { ActionResult } from "@/features/auth/actions";

// ── Create liquidation (header only, categories added in edit) ────────────────

export async function createLiquidationAction(formData: FormData): Promise<ActionResult & { id?: string }> {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") {
    return { success: false, error: "Not authenticated." };
  }
  if (!session.user.officeId) {
    return { success: false, error: "No office assigned." };
  }

  const raw = {
    prNumber:            formData.get("prNumber"),
    payerName:           formData.get("payerName"),
    date:                formData.get("date"),
    projectName:         formData.get("projectName"),
    collegeDept:         formData.get("collegeDept"),
    approvedBudgetTotal: formData.get("approvedBudgetTotal"),
    cvCdvNumber:         formData.get("cvCdvNumber") || undefined,
    cvCdvDate:           formData.get("cvCdvDate") || undefined,
    claimantName:        formData.get("claimantName"),
    deanHeadName:        formData.get("deanHeadName"),
  };

  const parsed = LiquidationHeaderSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const d = parsed.data;

  // Seed default categories from the office
  const office = await db.office.findUnique({ where: { id: session.user.officeId } });
  const defaultCategories = (office?.default_categories as string[]) ?? [];

  const liq = await db.liquidation.create({
    data: {
      office_id:             session.user.officeId,
      pr_number:             d.prNumber,
      payer_name:            d.payerName,
      date:                  new Date(d.date),
      project_name:          d.projectName,
      college_dept:          d.collegeDept,
      approved_budget_total: d.approvedBudgetTotal,
      cv_cdv_number:         d.cvCdvNumber ?? null,
      cv_cdv_date:           d.cvCdvDate ? new Date(d.cvCdvDate) : null,
      claimant_name:         d.claimantName,
      dean_head_name:        d.deanHeadName,
      created_by:            session.user.id,
      last_edited_by:        session.user.id,
      expense_categories: {
        create: defaultCategories.map((name, i) => ({
          name,
          approved_budget_amount: 0,
          sort_order: i,
        })),
      },
    },
  });

  return { success: true, id: liq.id };
}

// ── Update liquidation header ─────────────────────────────────────────────────

export async function updateLiquidationHeaderAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") {
    return { success: false, error: "Not authenticated." };
  }

  const liq = await db.liquidation.findUnique({ where: { id, deleted_at: null } });
  if (!liq) return { success: false, error: "Liquidation not found." };
  if (session.user.role === "Encoder" && liq.office_id !== session.user.officeId) {
    return { success: false, error: "Forbidden." };
  }

  const raw = {
    prNumber:            formData.get("prNumber"),
    payerName:           formData.get("payerName"),
    date:                formData.get("date"),
    projectName:         formData.get("projectName"),
    collegeDept:         formData.get("collegeDept"),
    approvedBudgetTotal: formData.get("approvedBudgetTotal"),
    cvCdvNumber:         formData.get("cvCdvNumber") || undefined,
    cvCdvDate:           formData.get("cvCdvDate") || undefined,
    claimantName:        formData.get("claimantName"),
    deanHeadName:        formData.get("deanHeadName"),
  };

  const parsed = LiquidationHeaderSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const d = parsed.data;
  await db.liquidation.update({
    where: { id },
    data: {
      pr_number:             d.prNumber,
      payer_name:            d.payerName,
      date:                  new Date(d.date),
      project_name:          d.projectName,
      college_dept:          d.collegeDept,
      approved_budget_total: d.approvedBudgetTotal,
      cv_cdv_number:         d.cvCdvNumber ?? null,
      cv_cdv_date:           d.cvCdvDate ? new Date(d.cvCdvDate) : null,
      claimant_name:         d.claimantName,
      dean_head_name:        d.deanHeadName,
      last_edited_by:        session.user.id,
    },
  });

  return { success: true };
}

// ── Save expense categories + items (full replace) ───────────────────────────

export interface CategoryInput {
  id?: string;
  name: string;
  approvedBudgetAmount: number;
  items: ItemInput[];
}

export interface ItemInput {
  id?: string;
  payee: string;
  amount: number;
  docType: "receipt" | "certification" | "acknowledgement_receipt";
  docReference?: string;
  certReason?: string;
  arReasonTemplate?: "honorarium" | "raffle_prize" | "custom";
  arReasonText?: string;
  arEventName?: string;
  arEventDates?: string;
  arVenue?: string;
}

export async function saveExpenseCategoriesAction(
  liquidationId: string,
  categories: CategoryInput[],
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") {
    return { success: false, error: "Not authenticated." };
  }

  const liq = await db.liquidation.findUnique({ where: { id: liquidationId, deleted_at: null } });
  if (!liq) return { success: false, error: "Liquidation not found." };
  if (session.user.role === "Encoder" && liq.office_id !== session.user.officeId) {
    return { success: false, error: "Forbidden." };
  }

  // Delete all existing categories (cascade deletes items + cert/ar entries)
  await db.expenseCategory.deleteMany({ where: { liquidation_id: liquidationId } });

  // Re-create everything fresh
  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    const createdCat = await db.expenseCategory.create({
      data: {
        liquidation_id:         liquidationId,
        name:                   cat.name,
        approved_budget_amount: cat.approvedBudgetAmount,
        sort_order:             ci,
      },
    });

    for (const item of cat.items) {
      const createdItem = await db.expenseItem.create({
        data: {
          category_id:   createdCat.id,
          payee:         item.payee,
          amount:        item.amount,
          doc_type:      item.docType,
          doc_reference: item.docType === "receipt" ? (item.docReference ?? null) : null,
        },
      });

      if (item.docType === "certification" && item.certReason) {
        await db.certificationEntry.create({
          data: {
            liquidation_id:  liquidationId,
            expense_item_id: createdItem.id,
            reason:          item.certReason,
          },
        });
      }

      if (item.docType === "acknowledgement_receipt") {
        const amount = item.amount;
        await db.acknowledgementReceipt.create({
          data: {
            expense_item_id:  createdItem.id,
            amount_in_words:  amountInWords(amount),
            reason_template:  item.arReasonTemplate ?? "honorarium",
            reason_text:      item.arReasonText ?? "",
            event_name:       item.arEventName ?? "",
            event_dates:      item.arEventDates ?? "",
            venue:            item.arVenue ?? "",
          },
        });
      }
    }
  }

  await db.liquidation.update({
    where: { id: liquidationId },
    data: { last_edited_by: session.user.id },
  });

  return { success: true };
}

// ── Update liquidation status ─────────────────────────────────────────────────

export async function updateLiquidationStatusAction(
  id: string,
  status: "draft" | "generated" | "submitted_to_fao" | "completed",
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") {
    return { success: false, error: "Not authenticated." };
  }

  const liq = await db.liquidation.findUnique({ where: { id, deleted_at: null } });
  if (!liq) return { success: false, error: "Not found." };
  if (session.user.role === "Encoder" && liq.office_id !== session.user.officeId) {
    return { success: false, error: "Forbidden." };
  }

  await db.liquidation.update({ where: { id }, data: { status, last_edited_by: session.user.id } });
  return { success: true };
}

// ── Soft delete ───────────────────────────────────────────────────────────────

export async function deleteLiquidationAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") {
    return { success: false, error: "Not authenticated." };
  }

  const liq = await db.liquidation.findUnique({ where: { id, deleted_at: null } });
  if (!liq) return { success: false, error: "Not found." };
  if (session.user.role === "Encoder" && liq.office_id !== session.user.officeId) {
    return { success: false, error: "Forbidden." };
  }

  await db.liquidation.update({ where: { id }, data: { deleted_at: new Date() } });
  return { success: true };
}
