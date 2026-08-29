"use client";

import { useTransition, useState } from "react";
import { approveUserAction, rejectUserAction } from "@/features/admin/actions";

interface ApprovalRowProps {
  userId: string;
  name: string;
  email: string;
  requestedOffice: string | null;
}

export function ApprovalRow({ userId, name, email, requestedOffice }: ApprovalRowProps) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approveUserAction(userId);
      if (res.success) setDone("approved");
      else setError(res.error);
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectUserAction(userId);
      if (res.success) setDone("rejected");
      else setError(res.error);
    });
  }

  if (done === "approved") {
    return (
      <tr className="border-b border-border last:border-0 bg-green-50">
        <td className="px-4 py-3 font-medium text-ink">{name}</td>
        <td className="px-4 py-3 text-ink/70">{email}</td>
        <td className="px-4 py-3 text-ink/70">{requestedOffice ?? <span className="italic text-ink/40">Not selected</span>}</td>
        <td className="px-4 py-3 text-xs font-medium text-green-700">Approved</td>
      </tr>
    );
  }

  if (done === "rejected") {
    return (
      <tr className="border-b border-border last:border-0 bg-red-50">
        <td className="px-4 py-3 font-medium text-ink">{name}</td>
        <td className="px-4 py-3 text-ink/70">{email}</td>
        <td className="px-4 py-3 text-ink/70">{requestedOffice ?? <span className="italic text-ink/40">Not selected</span>}</td>
        <td className="px-4 py-3 text-xs font-medium text-red-700">Rejected</td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 font-medium text-ink">{name}</td>
      <td className="px-4 py-3 text-ink/70">{email}</td>
      <td className="px-4 py-3 text-ink/70">
        {requestedOffice ?? <span className="italic text-ink/40">Not selected</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={pending || !requestedOffice}
              title={!requestedOffice ? "User has not selected an office yet" : undefined}
              className="rounded-md bg-maroon px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-maroon-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "…" : "Approve"}
            </button>
            <button
              onClick={handleReject}
              disabled={pending}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink/60 transition-colors hover:bg-bg-subtle disabled:opacity-40"
            >
              {pending ? "…" : "Reject"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </td>
    </tr>
  );
}
