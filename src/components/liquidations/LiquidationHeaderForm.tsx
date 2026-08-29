"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLiquidationAction, updateLiquidationHeaderAction } from "@/features/liquidations/actions";

interface Props {
  defaultCollegeDept?: string;
  existing?: {
    id: string;
    prNumber: string;
    payerName: string;
    date: string;
    projectName: string;
    collegeDept: string;
    approvedBudgetTotal: number;
    cvCdvNumber: string;
    cvCdvDate: string;
    claimantName: string;
    deanHeadName: string;
  };
}

function Field({
  label, name, type = "text", defaultValue = "", placeholder = "", required = false, step,
}: {
  label: string; name: string; type?: string; defaultValue?: string | number;
  placeholder?: string; required?: boolean; step?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-xs font-medium text-ink/70">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="rounded-md border border-border px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-maroon focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </div>
  );
}

export function LiquidationHeaderForm({ defaultCollegeDept = "", existing }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (existing) {
        const res = await updateLiquidationHeaderAction(existing.id, formData);
        if (res.success) {
          router.push(`/liquidations/${existing.id}/edit`);
        } else {
          setError(res.error);
        }
      } else {
        const res = await createLiquidationAction(formData);
        if (res.success && res.id) {
          router.push(`/liquidations/${res.id}/edit`);
        } else if (!res.success) {
          setError(res.error);
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-ink">Basic Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="PR Number" name="prNumber" defaultValue={existing?.prNumber} required placeholder="PR-2002QAOADM-26-009412" />
          <Field label="Date" name="date" type="date" defaultValue={existing?.date} required />
          <Field label="Payer Name" name="payerName" defaultValue={existing?.payerName} required placeholder="Full name" />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Project Name / Activity" name="projectName" defaultValue={existing?.projectName} required placeholder="e.g. 2026 BUYLO: Admin Offices' Progress and Plans Presentation" />
          </div>
          <div className="sm:col-span-2">
            <Field label="College / Dept." name="collegeDept" defaultValue={existing?.collegeDept ?? defaultCollegeDept} required />
          </div>
          <Field label="Approved Budget (₱)" name="approvedBudgetTotal" type="number" step="0.01" defaultValue={existing?.approvedBudgetTotal ?? ""} required placeholder="0.00" />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-ink">CV/CDV Details <span className="ml-1 font-normal text-ink/40">(optional)</span></h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="CV/CDV Number" name="cvCdvNumber" defaultValue={existing?.cvCdvNumber} placeholder="Leave blank if not yet issued" />
          <Field label="CV/CDV Date" name="cvCdvDate" type="date" defaultValue={existing?.cvCdvDate} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-ink">Signatories</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Claimant Name" name="claimantName" defaultValue={existing?.claimantName} required placeholder="Full name as it will appear on the document" />
          <Field label="Dean / Department Head Name" name="deanHeadName" defaultValue={existing?.deanHeadName} required placeholder="Full name" />
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-maroon px-5 py-2.5 text-sm font-medium text-white hover:bg-maroon-dark disabled:opacity-50"
        >
          {pending ? "Saving…" : existing ? "Save & Continue to Expenses →" : "Create & Add Expenses →"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-border px-4 py-2.5 text-sm text-ink/60 hover:bg-[#f8f7f5]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
