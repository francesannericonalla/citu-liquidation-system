"use client";

import { useState, useTransition } from "react";
import { deactivateUserAction, reactivateUserAction } from "@/features/admin/actions";

export function UserActionButton({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const isActive = currentStatus === "active";

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className={`rounded px-3 py-1 text-xs font-medium ${
          isActive
            ? "border border-red-200 text-red-600 hover:bg-red-50"
            : "border border-green-200 text-green-700 hover:bg-green-50"
        }`}
      >
        {isActive ? "Deactivate" : "Reactivate"}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2 rounded-md border px-2 py-1 text-xs">
      <span className="text-ink/60">Sure?</span>
      <button
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            if (isActive) {
              await deactivateUserAction(userId);
            } else {
              await reactivateUserAction(userId);
            }
            setConfirming(false);
          });
        }}
        className="font-semibold text-maroon hover:underline disabled:opacity-50"
      >
        {pending ? "…" : "Yes"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-ink/40 hover:text-ink">
        No
      </button>
    </div>
  );
}
