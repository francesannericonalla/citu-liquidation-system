"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLiquidationAction } from "@/features/liquidations/actions";

export function DeleteButton({ liquidationId }: { liquidationId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-1.5">
      <span className="text-xs text-red-700">Are you sure?</span>
      <button
        onClick={() => {
          startTransition(async () => {
            await deleteLiquidationAction(liquidationId);
            router.push("/liquidations");
          });
        }}
        disabled={pending}
        className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs text-ink/50 hover:text-ink"
      >
        Cancel
      </button>
    </div>
  );
}
