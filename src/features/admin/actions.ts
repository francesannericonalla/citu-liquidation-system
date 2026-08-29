"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/features/auth/actions";

async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "Admin") return null;
  return { id: session.user.id };
}

// ── Approve sign-up request ───────────────────────────────────────────────────

export async function approveUserAction(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized." };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { requested_office_id: true, approval_status: true },
  });

  if (!user) return { success: false, error: "User not found." };
  if (!user.requested_office_id) {
    return { success: false, error: "User has not selected an office yet." };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      approval_status: "active",
      office_id: user.requested_office_id,
      approved_by: admin.id,
      approved_at: new Date(),
    },
  });

  revalidatePath("/admin/approvals");
  return { success: true };
}

// ── Reject sign-up request ────────────────────────────────────────────────────

export async function rejectUserAction(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized." };

  await db.user.update({
    where: { id: userId },
    data: { approval_status: "rejected" },
  });

  revalidatePath("/admin/approvals");
  return { success: true };
}

// ── Deactivate user ───────────────────────────────────────────────────────────
// Sets account_status = deactivated. Never hard-deletes. Never touches
// historical liquidation records — created_by / last_edited_by remain intact.

export async function deactivateUserAction(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized." };

  // Prevent an Admin from deactivating themselves.
  if (userId === admin.id) {
    return { success: false, error: "You cannot deactivate your own account." };
  }

  await db.user.update({
    where: { id: userId },
    data: { account_status: "deactivated" },
  });

  // The deactivated user's JWT will be invalidated on their next request
  // because auth.ts re-fetches account_status from the DB on every JWT tick.

  revalidatePath("/admin/users");
  return { success: true };
}
