"use client";

import { useState, useTransition } from "react";
import { updateLiquidationStatusAction } from "@/features/liquidations/actions";

const STATUSES = [
  { value: "draft",            label: "Draft" },
  { value: "generated",        label: "Generated" },
  { value: "submitted_to_fao", label: "Submitted to FAO" },
  { value: "completed",        label: "Completed" },
] as const;

type Status = typeof STATUSES[number]["value"];

export function StatusSelect({
  liquidationId,
  currentStatus,
}: {
  liquidationId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState<Status>(currentStatus as Status);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Status;
    setStatus(next);
    setSaved(false);
    startTransition(async () => {
      await updateLiquidationStatusAction(liquidationId, next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={handleChange}
        disabled={pending}
        className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm text-ink focus:border-maroon focus:outline-none disabled:opacity-50"
      >
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      {saved && <span className="text-xs text-green-600">Saved</span>}
    </div>
  );
}
