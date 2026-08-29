-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Encoder', 'Admin');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending_email_verification', 'pending_office_approval', 'active', 'rejected');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'deactivated');

-- CreateEnum
CREATE TYPE "LiquidationStatus" AS ENUM ('draft', 'generated', 'submitted_to_fao', 'completed');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('receipt', 'certification', 'acknowledgement_receipt');

-- CreateEnum
CREATE TYPE "ReasonTemplate" AS ENUM ('honorarium', 'raffle_prize', 'custom');

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_code" TEXT NOT NULL,
    "default_categories" JSONB NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "office_id" TEXT,
    "role" "Role" NOT NULL,
    "cit_email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "requested_office_id" TEXT,
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'pending_email_verification',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "account_status" "AccountStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liquidation" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "pr_number" TEXT NOT NULL,
    "payer_name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "project_name" TEXT NOT NULL,
    "college_dept" TEXT NOT NULL,
    "approved_budget_total" DECIMAL(12,2) NOT NULL,
    "cv_cdv_number" TEXT,
    "cv_cdv_date" DATE,
    "claimant_name" TEXT NOT NULL,
    "dean_head_name" TEXT NOT NULL,
    "status" "LiquidationStatus" NOT NULL DEFAULT 'draft',
    "created_by" TEXT NOT NULL,
    "last_edited_by" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liquidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "liquidation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "approved_budget_amount" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseItem" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "payee" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "doc_type" "DocType" NOT NULL,
    "doc_reference" TEXT,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationEntry" (
    "id" TEXT NOT NULL,
    "liquidation_id" TEXT NOT NULL,
    "expense_item_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "CertificationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcknowledgementReceipt" (
    "id" TEXT NOT NULL,
    "expense_item_id" TEXT NOT NULL,
    "amount_in_words" TEXT NOT NULL,
    "reason_template" "ReasonTemplate" NOT NULL,
    "reason_text" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_dates" TEXT NOT NULL,
    "venue" TEXT NOT NULL,

    CONSTRAINT "AcknowledgementReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Office_short_code_key" ON "Office"("short_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_cit_email_key" ON "User"("cit_email");

-- CreateIndex
CREATE UNIQUE INDEX "CertificationEntry_expense_item_id_key" ON "CertificationEntry"("expense_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "AcknowledgementReceipt_expense_item_id_key" ON "AcknowledgementReceipt"("expense_item_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_requested_office_id_fkey" FOREIGN KEY ("requested_office_id") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidation" ADD CONSTRAINT "Liquidation_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidation" ADD CONSTRAINT "Liquidation_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidation" ADD CONSTRAINT "Liquidation_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_liquidation_id_fkey" FOREIGN KEY ("liquidation_id") REFERENCES "Liquidation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationEntry" ADD CONSTRAINT "CertificationEntry_liquidation_id_fkey" FOREIGN KEY ("liquidation_id") REFERENCES "Liquidation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationEntry" ADD CONSTRAINT "CertificationEntry_expense_item_id_fkey" FOREIGN KEY ("expense_item_id") REFERENCES "ExpenseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcknowledgementReceipt" ADD CONSTRAINT "AcknowledgementReceipt_expense_item_id_fkey" FOREIGN KEY ("expense_item_id") REFERENCES "ExpenseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
