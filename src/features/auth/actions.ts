"use server";

import { redirect } from "next/navigation";
import { signIn, signOut, auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import bcrypt from "bcryptjs";
import {
  SignUpSchema,
  SelectOfficeSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/lib/validators";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

// ── Sign up ───────────────────────────────────────────────────────────────────

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = SignUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { cit_email: email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const password_hash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: {
      name,
      cit_email: email,
      password_hash,
      role: "Encoder",
      // Email verification skipped — Admin approval is the real gate.
      email_verified_at: new Date(),
      approval_status: "pending_office_approval",
      account_status: "active",
    },
  });

  return { success: true };
}

// ── Select office ─────────────────────────────────────────────────────────────

export async function selectOfficeAction(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated." };

  const parsed = SelectOfficeSchema.safeParse({ officeId: formData.get("officeId") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const office = await db.office.findUnique({ where: { id: parsed.data.officeId } });
  if (!office) return { success: false, error: "Office not found." };

  await db.user.update({
    where: { id: session.user.id },
    data: { requested_office_id: parsed.data.officeId },
  });

  return { success: true };
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData) {
  await signIn("credentials", {
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: "/auth/redirect",
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

// ── Forgot password ───────────────────────────────────────────────────────────

export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = ForgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const user = await db.user.findUnique({ where: { cit_email: parsed.data.email } });
  // Don't reveal whether the email exists — always return success to prevent enumeration.
  if (!user) {
    return { success: true, message: "If that email is registered, a reset link has been sent." };
  }

  const token = await createPasswordResetToken(user.id);
  await sendPasswordResetEmail(parsed.data.email, token);

  return { success: true, message: "If that email is registered, a reset link has been sent." };
}

// ── Reset password ────────────────────────────────────────────────────────────

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const record = await db.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!record || record.expires < new Date()) {
    return { success: false, error: "This reset link has expired or is invalid." };
  }

  const password_hash = await bcrypt.hash(parsed.data.password, 12);

  await db.user.update({
    where: { id: record.userId },
    data: { password_hash },
  });

  await db.passwordResetToken.delete({ where: { token: parsed.data.token } });

  return { success: true, message: "Password updated. You can now log in." };
}
