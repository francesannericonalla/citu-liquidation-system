"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { selectOfficeAction } from "@/features/auth/actions";

interface Office {
  id: string;
  name: string;
  short_code: string;
}

interface Props {
  offices: Office[];
}

function SelectOfficeForm({ offices }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await selectOfficeAction(formData);
      if (res.success) {
        router.push("/pending-approval");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <AuthCard title="Select Your Office">
      <p className="mb-4 text-sm text-ink/60">
        Choose the office you belong to. An Admin will review and approve your access request.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="officeId" className="text-xs font-medium text-ink/70">
            Office
          </label>
          <select
            id="officeId"
            name="officeId"
            required
            className="rounded-md border border-border px-3 py-2 text-sm text-ink focus:border-maroon focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="">Select an office…</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.short_code})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-maroon px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-maroon-dark disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Request Access"}
        </button>
      </form>
    </AuthCard>
  );
}

// Client wrapper that fetches offices on mount
export default function SelectOfficePage() {
  const [offices, setOffices] = useState<Office[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/offices")
      .then(async (r) => {
        const text = await r.text();
        console.log("[select-office] /api/offices status:", r.status, "body:", text);
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${text}`);
        const data = JSON.parse(text);
        if (!Array.isArray(data) || data.length === 0) throw new Error("Empty list returned");
        setOffices(data);
      })
      .catch((e) => {
        console.error("[select-office] fetch failed:", e);
        setFetchError(String(e));
      });
  }, []);

  if (fetchError) {
    return (
      <AuthCard title="Select Your Office">
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          Failed to load offices: {fetchError}
        </p>
      </AuthCard>
    );
  }

  if (offices === null) {
    return (
      <AuthCard title="Select Your Office">
        <p className="text-sm text-ink/60">Loading offices…</p>
      </AuthCard>
    );
  }

  return <SelectOfficeForm offices={offices} />;
}
