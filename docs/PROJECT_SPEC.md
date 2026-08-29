# PROJECT_SPEC.md — CIT-U Liquidation System

This file is the source of truth for this project. Read it fully before making changes. If a decision here conflicts with something requested mid-session, point out the conflict rather than silently picking one.

## What this is

An internal web app for Cebu Institute of Technology - University that replaces a manual, paper/Word/Excel liquidation process for reporting expenses after an approved activity. Multiple offices (QAO-Admin, RDCO, HRD, ...) use it. It is **not** an approval/e-signature system — it generates print-ready PDFs that get physically signed and submitted to Finance and Accounting (FAO) exactly as before. The system's whole value is: no manual arithmetic, no retyping the same numbers across three documents, and a searchable record of every liquidation ever made.

## Tech stack — decided, do not swap without flagging it first

- **Next.js (App Router), TypeScript** — single codebase, frontend + backend together
- **PostgreSQL** as the database (Supabase in production, Docker Compose locally)
- **Prisma** as the ORM (pinned to 5.22.x — do not upgrade to Prisma 8)
- **Auth.js (NextAuth)**, Credentials provider (email + password), with email verification
- **Resend** for transactional email (verification links) — fallback option is Microsoft Graph API through the school's O365 tenant, but start with Resend for speed
- **@react-pdf/renderer** to build PDFs directly in code, laid out to match the reference templates' visual appearance precisely (headers, tables, spacing, signature blocks). The `.docx` files are the **visual source of truth** to match against — they are not filled programmatically. Reason: LibreOffice conversion requires a system binary incompatible with free serverless hosting (Vercel).
- **Recharts** for the dashboard charts
- **SheetJS (`xlsx`)** for Excel export
- **Docker Compose** for local dev (Next.js app + Postgres). Production runs on Vercel (app) + Supabase (Postgres) + Resend (email) + scheduled GitHub Action for `pg_dump` backups.

## Deployment

| Environment | Service | Notes |
|---|---|---|
| App hosting | Vercel | Free tier, serverless |
| Database | Supabase (PostgreSQL) | `DATABASE_URL` = pooled connection (port 6543, `?pgbouncer=true`); `DIRECT_URL` = direct connection (port 5432) for migrations |
| Email | Resend | Transactional only |
| DB backups | GitHub Actions scheduled job | `pg_dump` on a cron, stored as artifacts or pushed to a private repo |
| Local dev | Docker Compose | Both `DATABASE_URL` and `DIRECT_URL` point to `localhost:5432` |

## Roles & access model

Two roles only:
- **Encoder** — office-scoped. Can view and edit **any** liquidation belonging to their own office (collaborative, not locked to whoever created it).
- **Admin** — oversees **all** offices. Approves/rejects sign-ups, can view any office's data. No per-office admin delegation — keep this as a single flat role.

### Sign-up / access flow (build exactly this sequence, in this order)

1. Sign-up with email + password. Email must match the `@cit.edu` domain — validate server-side, not just in the UI.
2. Send a verification email (via Resend). Clicking it proves *identity* only.
3. User selects an office from a dropdown (hardcoded list for now: `QAO-Admin`, `RDCO`, `HRD` — store as data, not enum, so it's editable later). This is a *request*, not a grant.
4. Account sits in `pending_office_approval`. User can log in but sees only a "your access request is pending" screen — no liquidation data.
5. An Admin sees a pending-approvals queue (name, verified email, requested office) and approves or rejects. Only approval flips the account to `active` with office-scoped access.

**Why the two checks are separate:** verifying a `@cit.edu` email proves identity, not office membership — anyone with that domain could otherwise claim any office. The Admin approval step is the actual membership check, and it has to be a human judgment call, not more validation logic.

### Account lifecycle rules — do not violate these

- **Bootstrapping:** the very first Admin account cannot come through the normal sign-up flow (nothing exists yet to approve it). Create it via a one-time seed script, not the UI.
- **Deactivation, never hard-delete of users.** An Admin can deactivate a user (`account_status = deactivated`), which revokes login, but the user row and all their historical `created_by`/`last_edited_by` attributions on liquidations must remain fully intact. Never cascade-delete or orphan those references.
- **Liquidation deletion:** allowed, but requires an explicit confirmation step in the UI ("Are you sure you want to delete this liquidation?"). Deletion is a **soft delete** (`deleted_at` timestamp set). A scheduled job permanently purges soft-deleted liquidations after **30 days**. Never hard-delete immediately on user action.
- **Concurrent edits:** last-write-wins is the accepted behavior (no locking). Every liquidation carries `last_edited_by` + `updated_at` so conflicting edits are at least visible after the fact.

## Data model

```
Office ──< User
Office ──< Liquidation ──< ExpenseCategory ──< ExpenseItem
                                            ├──< AcknowledgementReceipt (1:1 with a flagged ExpenseItem)
Liquidation ──< CertificationEntry (1:1 with a flagged ExpenseItem)
```

### Office
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| name | string | e.g. "Quality Assurance Office - Admin" |
| short_code | string | e.g. "QAO-Admin" |
| default_categories | JSON/array | seeded from the 7 standard categories below, editable |

### User
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| name | string | |
| office_id | FK → Office, nullable until approved | |
| role | enum | `Encoder` / `Admin` |
| cit_email | string, unique | must match `@cit.edu` |
| password_hash | string | bcrypt/argon2 — never plaintext |
| email_verified_at | timestamp, nullable | |
| requested_office_id | FK → Office | chosen at sign-up, may differ from final `office_id` if reassigned |
| approval_status | enum | `pending_email_verification` / `pending_office_approval` / `active` / `rejected` |
| approved_by | FK → User, nullable | |
| approved_at | timestamp, nullable | |
| account_status | enum | `active` / `deactivated` |

### Liquidation
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| office_id | FK → Office | |
| pr_number | string | free text — format varies per office, do not validate a strict pattern |
| payer_name | string | |
| date | date | |
| project_name | string | |
| college_dept | string | defaults to office name, editable |
| approved_budget_total | decimal | manual entry — comes from the PR, cannot be derived |
| cv_cdv_number | string, optional | |
| cv_cdv_date | date, optional | |
| claimant_name | string | |
| dean_head_name | string | |
| status | enum | `draft` / `generated` / `submitted_to_fao` / `completed` — set manually by the encoder as paperwork physically progresses |
| created_by | FK → User | |
| last_edited_by | FK → User | |
| deleted_at | timestamp, nullable | soft-delete; purge job runs on rows older than 30 days |
| created_at / updated_at | timestamp | |

### ExpenseCategory (per-liquidation — editable, not a fixed global enum)
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| liquidation_id | FK → Liquidation | |
| name | string | default seed: Registration, Accommodation, Meals/Foods/Snacks, Supplies, Documentation, Transportation, Others — but the user must be able to add/remove/rename per liquidation, since not every PR breaks down into all 7 |
| approved_budget_amount | decimal | manual entry |
| sort_order | int | |

### ExpenseItem (one row = one receipt/expense line)
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| category_id | FK → ExpenseCategory | |
| payee | string | |
| amount | decimal | |
| doc_type | enum | `receipt` (has SI#/OR#/Inv#) / `certification` (no receipt) / `acknowledgement_receipt` (cash paid directly to a person) |
| doc_reference | string, nullable | e.g. "SI#002058" — blank when doc_type is certification or acknowledgement_receipt |

No receipt image upload, no OCR — all entry is manual by design. Physical receipts are photocopied and filed outside the system.

### CertificationEntry (1:1 with an ExpenseItem where doc_type = certification)
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| liquidation_id | FK → Liquidation | |
| expense_item_id | FK → ExpenseItem, unique | |
| reason | text | why there's no receipt — the only field a human types here; payee/amount/category are inherited |

### AcknowledgementReceipt (1:1 with an ExpenseItem where doc_type = acknowledgement_receipt)
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| expense_item_id | FK → ExpenseItem, unique | recipient name and amount derive from ExpenseItem.payee and ExpenseItem.amount at render time — not stored separately |
| amount_in_words | string | auto-generated, see Business Logic below |
| reason_template | enum | `honorarium` / `raffle_prize` / `custom` |
| reason_text | text | the rendered sentence — editable, since it's context-specific and can't be fully derived |
| event_name | string | italicized in the printed doc |
| event_dates | string | free text, e.g. "June 30, July 1, 2, and 3, 2026" |
| venue | string | |

## Business logic — implement exactly, this is the whole point of the system

1. **Category actual expense** = sum of `ExpenseItem.amount` in that category, across all `doc_type`s.
2. **Category variance** = `approved_budget_amount − actual expense` for that category.
3. **Total approved budget** = sum of all category `approved_budget_amount` (should reconcile with `Liquidation.approved_budget_total` — surface a warning if they don't match, don't silently override).
4. **Total actual expense** = sum of every `ExpenseItem.amount` in the liquidation.
5. **Total variance** = Total approved − Total actual.
6. **Returned Amount vs. Excess Budget (mutually exclusive):**
   - actual ≤ approved → **Returned Amount** = total variance (positive).
   - actual > approved → **Excess Budget per O.R. No.** = actual − approved (this stays a manual print blank for the O.R. number itself; the system just computes and flags which case applies).
7. **Receipt validity rule (no threshold exceptions — confirmed):**
   - Has SI#/OR#/Inv# → `doc_type = receipt`, nothing else generated.
   - No receipt, minor/odd expense → `doc_type = certification`, appears on the Certification document with its reason.
   - Cash paid directly to a person → `doc_type = acknowledgement_receipt`, generates a signable Acknowledgement Receipt (2-up per page, matching the sample templates).
8. **Amount-in-words**: standard Philippine-peso number-to-words (e.g. 400.00 → "Four Hundred Pesos Only"; 2266.11 → "Two Thousand Two Hundred Sixty-Six Pesos and 11/100"). Write this as a pure, unit-testable utility function. Test it against centavos, ₱0, and six-figure amounts before it's used on anything a person signs.
9. **Formatting rule — blanks render as "-", never "0.00".** This matches the existing templates exactly (unused categories like Registration/Accommodation print a dash). Do not let computed zeros silently print as "₱0.00" — check this specifically when building the PDF renderer.

Everything that *can* be derived from the ledger (category totals, actual expense, variance, recipient name on Acknowledgement Receipts) must be derived — never re-entered by the user. The only manually-typed numbers are the approved budget (per category, from the PR) and the reason/purpose text fields (Certification reason, Acknowledgement Receipt reason).

## Document generation

Four outputs per liquidation, all rendered from the same dataset — regeneration is always a fresh render, no versioning/diffing needed. PDFs are built directly with `@react-pdf/renderer`, styled to match the reference `.docx` templates' layout precisely. The `.docx` files are the visual source of truth; consult them when building PDF components.

| Document | Source | Notes |
|---|---|---|
| Liquidation Report | Liquidation header + ExpenseCategory rows (approved/actual/variance) + totals + Returned Amount or Excess Budget | matches `TEMPLATE_LIQUIDATION_REPORT` |
| Certification | Liquidation header + all CertificationEntry rows + reasons, summed | matches `TEMPLATE_Certification` — skip generating if there are zero certification-type items |
| Acknowledgement Receipt(s) | One per AcknowledgementReceipt record, batched into one PDF, 2-up per page | matches the acknowledgement receipt samples |
| Type of Expenses (breakdown) | All ExpenseItem rows grouped by category, subtotals + grand total | matches `TEMPLATE_Type_of_Expenses` — also offer an Excel export of this, not just PDF |

## Repository & dashboard

- **Repository**: a filterable list of every liquidation across offices — Office, PR No., Project, Date, Approved budget, Total actual expense (computed), Status. Filter by office, status, date range. Encoders see their own office by default; Admins can see all.
- **Dashboard**: liquidation counts by status, approved-vs-actual by office/period, spend by category. Keep it to a handful of simple charts, not a full BI tool.
- **Export**: one-click Excel export of the (filtered) repository list, and optionally the category-totals summary behind the dashboard.

## Explicitly out of scope — do not build these unless asked

- E-signatures or any digital approval workflow (signing stays on paper)
- PR portal integration/scraping — PR data entry is permanently manual
- Receipt photo upload / OCR — permanently manual entry
- FAO-side digital review/kickback workflow
- Per-office Admin delegation — one flat Admin role covers everything
- Mobile app

## Data privacy note

This system stores names tied to cash amounts, including non-staff third parties (e.g. raffle winners on Acknowledgement Receipts). Keep access strictly office-scoped for Encoders, and don't build any feature that exposes cross-office data to non-Admins.

## Conventions while building

- TypeScript strict mode on.
- Validate all form input with Zod schemas that mirror the tables above.
- Prefer server actions / route handlers colocated with their feature, not one giant `api/` dump.
- When a business rule above is ambiguous for something you're implementing, ask rather than guessing — especially around the receipt-validity rule, the returned-amount/excess-budget branch, and the blank-vs-zero formatting rule, since those are the parts most likely to produce a subtly wrong printed document.
