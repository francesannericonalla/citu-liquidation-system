# CIT-U Liquidation System — Build Checklist

Track progress here as you go. Check items off as Claude Code confirms them working — not just "sent the prompt," but actually tested. Update this file yourself, or ask Claude Code to keep a `memory/` note in sync with it.

---

## Infrastructure & one-time setup

- [x] Docker Desktop installed and running
- [x] Local Postgres container running (port 5433, remapped to avoid conflict with local PG 18 service)
- [x] Prisma schema written and migrated (`20260826053552_init` — 7 models, 6 enums live)
- [x] `CLAUDE.md` fixed (was clobbered by Next.js's auto-generated `AGENTS.md` — now correctly imports both `@AGENTS.md` and `@docs/PROJECT_SPEC.md`)
- [x] Seed script: 3 Offices (QAO-Admin, RDCO, HRD) + 1 bootstrap Admin — idempotent, runs clean twice
- [x] Bootstrap Admin login tested and confirmed working (session: `role: Admin`, `approvalStatus: active`, `officeId: null`)
- [ ] Supabase project created (for production — not needed yet while still building locally)
- [ ] Resend account + API key obtained (needed for password-reset emails — email verification was removed)
- [ ] CIT-U logo/wordmark asset provided to Claude Code (currently text-only header)
- [ ] Vercel project created (for deployment — not needed yet)
- [ ] Decide final bootstrap Admin email (currently `admin@cit.edu` — dummy inbox, no password reset possible on this account until changed to a real inbox)

## Design system

- [x] CIT-U brand colors (maroon/gold/cream/white) applied as design tokens
- [x] Poppins font applied (headings + body)
- [x] Tabular figures (`font-variant-numeric: tabular-nums`) applied to money columns
- [ ] Confirm tabular-nums actually shows up correctly once real ledger tables exist (Phase 3)

## Phase 0 — Project scaffolding
- [x] Next.js (App Router) + TypeScript + Tailwind set up
- [x] Docker Compose (app + Postgres services)
- [x] ESLint + Prettier configured
- [x] Feature-based folder structure (`src/features/{auth,liquidations,admin,dashboard,documents,repository}`)

## Phase 1 — Database schema
- [x] Prisma schema matches `PROJECT_SPEC.md` data model exactly
- [x] Office ↔ User relation ambiguity fixed (named relations + back-arrays)
- [x] `directUrl` added for Supabase-compatible migrations later
- [x] `AcknowledgementReceipt.recipient_name` removed (derived from `ExpenseItem.payee` instead, not stored separately)
- [x] Seed script for offices + bootstrap Admin

## Phase 2 — Authentication & access flow
- [x] Sign-up form (`@cit.edu`-only, server-validated with Zod)
- [x] ~~Email verification flow~~ — **removed** (Admin approval is the sole gate; email verification was redundant. Sign-up now skips `pending_email_verification` and goes directly to `pending_office_approval`.)
- [x] Office selection on sign-up (request, not grant — sets `requested_office_id`)
- [x] Pending-approval screen for unapproved users (shows correct message per approval_status)
- [x] Admin approvals queue (approve/reject — approve sets `office_id` + flips to `active`)
- [x] Login / logout (next-auth v5 Credentials provider; logout via server action)
- [x] Password reset flow (forgot-password → console-logged link → set new password)
- [x] Admin "deactivate user" action (sets `account_status = deactivated`; JWT re-validates on next request; historical liquidation refs untouched)
- [x] Public landing page (Log In / Sign Up only, no protected route links)
- [x] Authenticated home page (role-scoped module cards; Admin sees Admin card, Encoders don't)
- [x] Route protection (unauthenticated → `/login`; pending/rejected → `/pending-approval`; Encoder → blocked from `/admin/*`)
- [x] `proxy.ts` (Next.js 16 convention, replaces deprecated `middleware.ts`) wired and confirmed active
- [x] `.env.local` fixed to use port 5433 for Docker Compose Postgres (was 5432, conflicting with local PG 18 service)
- [x] **Test:** Admin login confirmed — session returns `role: Admin`, `approvalStatus: active`
- [x] **Test:** All public routes return 200; all protected routes return 307 → `/login` when unauthenticated
- [x] **Test:** Admin can reach `/admin/approvals` (200); unauthenticated request is blocked (307)
- [ ] **Test:** sign up a second test account end-to-end in the browser, confirm it lands in the pending queue
- [ ] **Test:** approve it as Admin in the browser, confirm the test account can log in and see office-scoped content

## Phase 3 — Liquidation core: create, ledger, live calculations
- [ ] "New Liquidation" form (PR info + editable category list)
- [ ] Ledger view (add/edit/delete expense items)
- [ ] Live category subtotals, variance, totals (recompute on every change)
- [ ] Returned Amount vs. Excess Budget branch
- [ ] Office-scoped collaborative editing (any encoder in the office can edit)
- [ ] `last_edited_by` / `updated_at` tracking
- [ ] Soft-delete with confirmation dialog
- [ ] Unit tests for calculation logic
- [ ] **Test:** create a liquidation with a single category (like the Baguio PR, no breakdown) — confirm it doesn't force all 7 categories

## Phase 4 — Certification & Acknowledgement Receipt handling
- [ ] `certification` doc_type flow (reason field, links to CertificationEntry)
- [ ] `acknowledgement_receipt` doc_type flow (recipient, reason template, event details)
- [ ] Amount-in-words utility function, unit tested (whole peso, centavos, ₱0, six figures)
- [ ] **Test:** confirm amount-in-words output on a few real past amounts before trusting it

## Phase 5 — Document generation (PDF/Excel)
- [ ] Liquidation Report PDF (via `@react-pdf/renderer`, not docx-fill — free-hosting constraint)
- [ ] Certification PDF (skipped when zero certification items, not generated empty)
- [ ] Acknowledgement Receipt PDF (2-up per page, batched)
- [ ] Type of Expenses breakdown — PDF + Excel export
- [ ] **Critical test:** blanks render as "-", never "0.00" — check on a liquidation with at least one unused category
- [ ] **Test:** edit the ledger, regenerate, confirm no stale data in the new PDF

## Phase 6 — Repository & dashboard
- [ ] Repository list (filter by office/status/date, sortable)
- [ ] Liquidation `status` field, manually updatable
- [ ] Dashboard charts (status counts, approved vs. actual, spend by category)
- [ ] Excel export of the repository view
- [ ] 30-day soft-delete purge job (scheduled)
- [ ] **Test:** confirm Encoders only see their own office by default, Admins can see all

## Phase 7 — Polish & deployment readiness
- [ ] Formatting rule (`-` not `0.00`) verified everywhere, not just one document
- [ ] Deactivated users don't break historical liquidation display
- [ ] Returned Amount / Excess Budget correctly mutually exclusive in every doc
- [ ] Office-scoping enforced at the route/query level (not just hidden UI)
- [ ] Docker Compose finalized for deployment (env vars, backup script)
- [ ] README with setup/deploy steps

## Deployment (once core features are solid)
- [ ] Supabase project created, connection strings obtained
- [ ] Production `DATABASE_URL` / `DIRECT_URL` set (Supabase pooled + direct)
- [ ] Resend API key wired in for real (no more console-logged links)
- [ ] Vercel project connected, deployed
- [ ] Scheduled GitHub Action for `pg_dump` backups against Supabase
- [ ] Real CIT-U logo asset in place
- [ ] First real Admin account created with a real, reachable email