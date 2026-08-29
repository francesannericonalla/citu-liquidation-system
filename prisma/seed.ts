// Bootstrap seed — run with: npm run db:seed
// Creates the three Offices and the first Admin account.
// Safe to run multiple times — upserts on short_code / cit_email.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_EXPENSE_CATEGORIES } from "../src/lib/constants";

const prisma = new PrismaClient();

const OFFICES = [
  { name: "Quality Assurance Office - Admin", short_code: "QAO-Admin" },
  { name: "Research and Development Cooperative Office", short_code: "RDCO" },
  { name: "Human Resource Department", short_code: "HRD" },
];

const ADMIN_EMAIL = "admin@cit.edu";
const ADMIN_NAME = "System Administrator";

async function main() {
  console.log("Seeding offices…");

  for (const office of OFFICES) {
    await prisma.office.upsert({
      where: { short_code: office.short_code },
      update: {}, // idempotent — don't overwrite existing data on re-run
      create: {
        name: office.name,
        short_code: office.short_code,
        default_categories: [...DEFAULT_EXPENSE_CATEGORIES],
      },
    });
    console.log(`  ✓ ${office.short_code}`);
  }

  console.log("Seeding bootstrap Admin…");

  // Cost factor 12 — appropriate for a login-checked hash.
  const password_hash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { cit_email: ADMIN_EMAIL },
    update: {}, // idempotent — don't reset password or status on re-run
    create: {
      name: ADMIN_NAME,
      cit_email: ADMIN_EMAIL,
      password_hash,
      role: "Admin",
      office_id: null,
      // Bootstrap account skips the normal verification + approval flow.
      email_verified_at: new Date(),
      approval_status: "active",
      account_status: "active",
    },
  });
  console.log(`  ✓ Admin: ${ADMIN_EMAIL}`);

  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
