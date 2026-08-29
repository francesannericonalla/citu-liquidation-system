import { z } from "zod";

const citEmail = z
  .string()
  .email("Enter a valid email address.")
  .endsWith("@cit.edu", "Only @cit.edu email addresses are allowed.");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export const SignUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters.").max(100),
    email: citEmail,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: citEmail,
  password: z.string().min(1, "Password is required."),
});

export const SelectOfficeSchema = z.object({
  officeId: z.string().uuid("Select a valid office."),
});

export const ForgotPasswordSchema = z.object({
  email: citEmail,
});

// ── Liquidation ───────────────────────────────────────────────────────────────

export const LiquidationHeaderSchema = z.object({
  prNumber:            z.string().min(1, "PR Number is required.").max(100),
  payerName:           z.string().min(1, "Payer name is required.").max(200),
  date:                z.string().min(1, "Date is required."),
  projectName:         z.string().min(1, "Project name is required.").max(500),
  collegeDept:         z.string().min(1, "College/Dept is required.").max(200),
  approvedBudgetTotal: z.coerce.number().positive("Approved budget must be greater than 0."),
  cvCdvNumber:         z.string().max(100).optional(),
  cvCdvDate:           z.string().optional(),
  claimantName:        z.string().min(1, "Claimant name is required.").max(200),
  deanHeadName:        z.string().min(1, "Dean/Head name is required.").max(200),
});

export const ExpenseItemSchema = z.object({
  payee:        z.string().min(1, "Payee is required.").max(300),
  amount:       z.coerce.number().min(0, "Amount cannot be negative."),
  docType:      z.enum(["receipt", "certification", "acknowledgement_receipt"]),
  docReference: z.string().max(100).optional(),
  // certification
  certReason:   z.string().max(1000).optional(),
  // acknowledgement receipt
  arReasonTemplate: z.enum(["honorarium", "raffle_prize", "custom"]).optional(),
  arReasonText:     z.string().max(1000).optional(),
  arEventName:      z.string().max(300).optional(),
  arEventDates:     z.string().max(200).optional(),
  arVenue:          z.string().max(300).optional(),
});

export const ExpenseCategorySchema = z.object({
  id:                   z.string().optional(),
  name:                 z.string().min(1, "Category name is required.").max(100),
  approvedBudgetAmount: z.coerce.number().min(0),
  items:                z.array(ExpenseItemSchema),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
