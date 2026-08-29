"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveExpenseCategoriesAction } from "@/features/liquidations/actions";
import type { CategoryInput, ItemInput } from "@/features/liquidations/actions";

interface Props {
  liquidationId: string;
  initialCategories: CategoryInput[];
  approvedBudgetTotal: number;
}

const DOC_TYPES = [
  { value: "receipt",                label: "Receipt (SI#/OR#/Inv#)" },
  { value: "certification",          label: "Certification (no receipt)" },
  { value: "acknowledgement_receipt",label: "Acknowledgement Receipt (cash to person)" },
] as const;

const AR_TEMPLATES = [
  { value: "honorarium",   label: "Honorarium" },
  { value: "raffle_prize", label: "Raffle Prize" },
  { value: "custom",       label: "Custom" },
] as const;

function newItem(): ItemInput {
  return { payee: "", amount: 0, docType: "receipt", docReference: "", certReason: "", arReasonTemplate: "honorarium", arReasonText: "", arEventName: "", arEventDates: "", arVenue: "" };
}
function newCategory(): CategoryInput {
  return { name: "", approvedBudgetAmount: 0, items: [newItem()] };
}

function peso(n: number) {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ExpenseEditor({ liquidationId, initialCategories, approvedBudgetTotal }: Props) {
  const [categories, setCategories] = useState<CategoryInput[]>(
    initialCategories.length > 0 ? initialCategories : [newCategory()],
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  // ── Computed totals ────────────────────────────────────────────────────────
  const totalActual = categories.reduce(
    (s, c) => s + c.items.reduce((ss, i) => ss + (Number(i.amount) || 0), 0), 0,
  );
  const totalApproved = categories.reduce((s, c) => s + (Number(c.approvedBudgetAmount) || 0), 0);
  const budgetMismatch = Math.abs(totalApproved - approvedBudgetTotal) > 0.01;
  const isOverBudget = totalActual > approvedBudgetTotal;

  // ── Category helpers ───────────────────────────────────────────────────────
  function updateCat(ci: number, patch: Partial<CategoryInput>) {
    setCategories((prev) => prev.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
  }
  function addCategory() { setCategories((p) => [...p, newCategory()]); }
  function removeCategory(ci: number) { setCategories((p) => p.filter((_, i) => i !== ci)); }

  // ── Item helpers ───────────────────────────────────────────────────────────
  function updateItem(ci: number, ii: number, patch: Partial<ItemInput>) {
    setCategories((prev) =>
      prev.map((c, i) =>
        i !== ci ? c : { ...c, items: c.items.map((item, j) => (j !== ii ? item : { ...item, ...patch })) },
      ),
    );
  }
  function addItem(ci: number) {
    setCategories((prev) => prev.map((c, i) => (i !== ci ? c : { ...c, items: [...c.items, newItem()] })));
  }
  function removeItem(ci: number, ii: number) {
    setCategories((prev) =>
      prev.map((c, i) => (i !== ci ? c : { ...c, items: c.items.filter((_, j) => j !== ii) })),
    );
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function handleSave(andView = false) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveExpenseCategoriesAction(liquidationId, categories);
      if (res.success) {
        if (andView) {
          router.push(`/liquidations/${liquidationId}`);
        } else {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Budget summary bar */}
      <div className="flex flex-wrap gap-6 rounded-lg border border-border bg-white px-6 py-4 shadow-sm text-sm">
        <div>
          <span className="text-xs text-ink/40 uppercase tracking-wide">Approved Budget</span>
          <p className="font-semibold text-ink">{peso(approvedBudgetTotal)}</p>
        </div>
        <div>
          <span className="text-xs text-ink/40 uppercase tracking-wide">Category Total</span>
          <p className={`font-semibold ${budgetMismatch ? "text-amber-600" : "text-ink"}`}>
            {peso(totalApproved)}
            {budgetMismatch && <span className="ml-1 text-xs font-normal text-amber-600">⚠ doesn't match approved budget</span>}
          </p>
        </div>
        <div>
          <span className="text-xs text-ink/40 uppercase tracking-wide">Total Actual</span>
          <p className={`font-semibold ${isOverBudget ? "text-red-600" : "text-green-700"}`}>
            {peso(totalActual)}
          </p>
        </div>
        <div>
          <span className="text-xs text-ink/40 uppercase tracking-wide">{isOverBudget ? "Excess" : "Returned"}</span>
          <p className={`font-semibold ${isOverBudget ? "text-red-600" : "text-green-700"}`}>
            {peso(Math.abs(approvedBudgetTotal - totalActual))}
          </p>
        </div>
      </div>

      {/* Categories */}
      {categories.map((cat, ci) => {
        const catActual = cat.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const catVariance = (Number(cat.approvedBudgetAmount) || 0) - catActual;
        return (
          <div key={ci} className="rounded-lg border border-border bg-white shadow-sm">
            {/* Category header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <input
                value={cat.name}
                onChange={(e) => updateCat(ci, { name: e.target.value })}
                placeholder="Category name (e.g. Meals/Foods/Snacks)"
                className="flex-1 rounded border border-border px-2 py-1 text-sm font-medium text-ink focus:border-maroon focus:outline-none"
              />
              <div className="flex items-center gap-1 text-xs text-ink/50">
                <span>Budget:</span>
                <span className="font-mono">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cat.approvedBudgetAmount || ""}
                  onChange={(e) => updateCat(ci, { approvedBudgetAmount: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-28 rounded border border-border px-2 py-1 text-right text-sm text-ink focus:border-maroon focus:outline-none"
                />
              </div>
              <span className="text-xs text-ink/40">
                Actual: <span className="font-semibold text-ink">{peso(catActual)}</span>
                &nbsp;|&nbsp;Variance:{" "}
                <span className={catVariance < 0 ? "text-red-600 font-semibold" : "text-green-700 font-semibold"}>
                  {peso(catVariance)}
                </span>
              </span>
              <button
                onClick={() => removeCategory(ci)}
                className="ml-2 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                Remove
              </button>
            </div>

            {/* Items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8f7f5] text-xs text-ink/40">
                  <tr>
                    <th className="px-3 py-2 text-left">Payee</th>
                    <th className="px-3 py-2 text-left">Document Type</th>
                    <th className="px-3 py-2 text-left">Reference No.</th>
                    <th className="px-3 py-2 text-right">Amount (₱)</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cat.items.map((item, ii) => (
                    <ItemRow
                      key={ii}
                      item={item}
                      onChange={(patch) => updateItem(ci, ii, patch)}
                      onRemove={() => removeItem(ci, ii)}
                      canRemove={cat.items.length > 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border px-4 py-2">
              <button
                onClick={() => addItem(ci)}
                className="text-xs font-medium text-maroon hover:underline"
              >
                + Add Item
              </button>
            </div>
          </div>
        );
      })}

      <button
        onClick={addCategory}
        className="rounded-lg border border-dashed border-border bg-white px-4 py-3 text-sm font-medium text-ink/50 hover:border-maroon hover:text-maroon"
      >
        + Add Category
      </button>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}
      {saved && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">Saved successfully.</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleSave(false)}
          disabled={pending}
          className="rounded-md bg-white border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-[#f8f7f5] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={pending}
          className="rounded-md bg-maroon px-5 py-2 text-sm font-medium text-white hover:bg-maroon-dark disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save & View Liquidation →"}
        </button>
      </div>
    </div>
  );
}

// ── Single item row ────────────────────────────────────────────────────────────

function ItemRow({
  item, onChange, onRemove, canRemove,
}: {
  item: ItemInput;
  onChange: (p: Partial<ItemInput>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <>
      <tr>
        <td className="px-3 py-2">
          <input
            value={item.payee}
            onChange={(e) => onChange({ payee: e.target.value })}
            placeholder="Payee / supplier"
            className="w-full rounded border border-border px-2 py-1 text-sm text-ink focus:border-maroon focus:outline-none"
          />
        </td>
        <td className="px-3 py-2">
          <select
            value={item.docType}
            onChange={(e) => onChange({ docType: e.target.value as ItemInput["docType"] })}
            className="w-full rounded border border-border px-2 py-1 text-sm text-ink focus:border-maroon focus:outline-none"
          >
            {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </td>
        <td className="px-3 py-2">
          {item.docType === "receipt" ? (
            <input
              value={item.docReference ?? ""}
              onChange={(e) => onChange({ docReference: e.target.value })}
              placeholder="e.g. SI#002058"
              className="w-full rounded border border-border px-2 py-1 text-sm text-ink focus:border-maroon focus:outline-none"
            />
          ) : (
            <span className="text-xs text-ink/30">—</span>
          )}
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={item.amount || ""}
            onChange={(e) => onChange({ amount: Number(e.target.value) })}
            placeholder="0.00"
            className="w-28 rounded border border-border px-2 py-1 text-right text-sm text-ink focus:border-maroon focus:outline-none"
          />
        </td>
        <td className="px-3 py-2 text-right">
          {canRemove && (
            <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-600">✕</button>
          )}
        </td>
      </tr>

      {/* Certification sub-row */}
      {item.docType === "certification" && (
        <tr className="bg-amber-50/50">
          <td colSpan={5} className="px-6 py-2">
            <label className="mb-1 block text-xs font-medium text-amber-700">
              Reason for no receipt
            </label>
            <textarea
              value={item.certReason ?? ""}
              onChange={(e) => onChange({ certReason: e.target.value })}
              placeholder="e.g. For the purchase of additional snacks from stores near CIT University that are unable to issue official receipts."
              rows={2}
              className="w-full rounded border border-amber-200 px-2 py-1 text-sm text-ink focus:border-amber-400 focus:outline-none"
            />
          </td>
        </tr>
      )}

      {/* Acknowledgement Receipt sub-row */}
      {item.docType === "acknowledgement_receipt" && (
        <tr className="bg-blue-50/50">
          <td colSpan={5} className="px-6 py-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-blue-700">Reason template</label>
                <select
                  value={item.arReasonTemplate ?? "honorarium"}
                  onChange={(e) => onChange({ arReasonTemplate: e.target.value as ItemInput["arReasonTemplate"] })}
                  className="w-full rounded border border-blue-200 px-2 py-1 text-sm text-ink focus:outline-none"
                >
                  {AR_TEMPLATES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-blue-700">Reason text (printed on AR)</label>
                <input
                  value={item.arReasonText ?? ""}
                  onChange={(e) => onChange({ arReasonText: e.target.value })}
                  placeholder="e.g. honorarium for providing additional assistance in washing dishes"
                  className="w-full rounded border border-blue-200 px-2 py-1 text-sm text-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-blue-700">Event name (italicized)</label>
                <input
                  value={item.arEventName ?? ""}
                  onChange={(e) => onChange({ arEventName: e.target.value })}
                  placeholder="e.g. ISO 21001 EOMS Training Series"
                  className="w-full rounded border border-blue-200 px-2 py-1 text-sm text-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-blue-700">Event dates</label>
                <input
                  value={item.arEventDates ?? ""}
                  onChange={(e) => onChange({ arEventDates: e.target.value })}
                  placeholder="e.g. June 30, July 1, 2, and 3, 2026"
                  className="w-full rounded border border-blue-200 px-2 py-1 text-sm text-ink focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-blue-700">Venue</label>
                <input
                  value={item.arVenue ?? ""}
                  onChange={(e) => onChange({ arVenue: e.target.value })}
                  placeholder="e.g. Jurani Hall, GLE Building"
                  className="w-full rounded border border-blue-200 px-2 py-1 text-sm text-ink focus:outline-none"
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
