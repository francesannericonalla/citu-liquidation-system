import { randomBytes } from "crypto";
import { db } from "@/lib/db/client";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createVerificationToken(userId: string): Promise<string> {
  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
  await db.verificationToken.upsert({
    where: { userId },
    update: { token, expires },
    create: { userId, token, expires },
  });
  return token;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 h
  await db.passwordResetToken.upsert({
    where: { userId },
    update: { token, expires },
    create: { userId, token, expires },
  });
  return token;
}
