export interface PdfExpenseItem {
  payee: string;
  amount: number;
  docType: "receipt" | "certification" | "acknowledgement_receipt";
  docReference: string | null;
}

export interface PdfExpenseCategory {
  name: string;
  approvedBudgetAmount: number;
  items: PdfExpenseItem[];
}

export interface PdfAcknowledgementReceipt {
  id: string;
  payee: string;
  amount: number;
  amountInWords: string;
  reasonText: string;
  eventName: string;
  eventDates: string;
  venue: string;
}

export interface PdfCertificationEntry {
  payee: string;
  amount: number;
  categoryName: string;
  reason: string;
}

export interface LiquidationPdfData {
  prNumber: string;
  payerName: string;
  date: string;           // formatted e.g. "July 3, 2026"
  projectName: string;
  collegeDept: string;
  approvedBudgetTotal: number;
  cvCdvNumber: string | null;
  cvCdvDate: string | null;
  claimantName: string;
  deanHeadName: string;
  officeName: string;
  categories: PdfExpenseCategory[];
  // computed
  totalActual: number;
  totalApproved: number;
  totalVariance: number;
  returnedAmount: number | null;   // null if excess
  excessAmount: number | null;     // null if returned
}

export interface CertificationPdfData {
  prNumber: string;
  payerName: string;
  date: string;
  projectName: string;
  collegeDept: string;
  approvedBudgetTotal: number;
  cvCdvNumber: string | null;
  cvCdvDate: string | null;
  claimantName: string;
  deanHeadName: string;
  entries: PdfCertificationEntry[];
  totalAmount: number;
  purpose: string;
}

export interface AcknowledgementReceiptPdfData {
  officeName: string;
  receipts: PdfAcknowledgementReceipt[];
}
