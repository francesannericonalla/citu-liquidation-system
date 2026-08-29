-- DropForeignKey
ALTER TABLE "AcknowledgementReceipt" DROP CONSTRAINT "AcknowledgementReceipt_expense_item_id_fkey";

-- DropForeignKey
ALTER TABLE "CertificationEntry" DROP CONSTRAINT "CertificationEntry_expense_item_id_fkey";

-- DropForeignKey
ALTER TABLE "CertificationEntry" DROP CONSTRAINT "CertificationEntry_liquidation_id_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseItem" DROP CONSTRAINT "ExpenseItem_category_id_fkey";

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ExpenseCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationEntry" ADD CONSTRAINT "CertificationEntry_liquidation_id_fkey" FOREIGN KEY ("liquidation_id") REFERENCES "Liquidation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationEntry" ADD CONSTRAINT "CertificationEntry_expense_item_id_fkey" FOREIGN KEY ("expense_item_id") REFERENCES "ExpenseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcknowledgementReceipt" ADD CONSTRAINT "AcknowledgementReceipt_expense_item_id_fkey" FOREIGN KEY ("expense_item_id") REFERENCES "ExpenseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
