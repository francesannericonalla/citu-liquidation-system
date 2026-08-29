// Shared TypeScript types for the CIT-U Liquidation System.
// Feature-specific types live alongside their feature module.

export type Role = "Encoder" | "Admin";

export type ApprovalStatus =
  | "pending_email_verification"
  | "pending_office_approval"
  | "active"
  | "rejected";

export type AccountStatus = "active" | "deactivated";

export type LiquidationStatus =
  | "draft"
  | "generated"
  | "submitted_to_fao"
  | "completed";

export type DocType = "receipt" | "certification" | "acknowledgement_receipt";

export type AcknowledgementReasonTemplate = "honorarium" | "raffle_prize" | "custom";
