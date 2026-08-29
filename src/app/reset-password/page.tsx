"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { FormField } from "@/components/FormField";
import { resetPasswordAction } from "@/features/auth/actions";
import { Suspense } from "react";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("token", token);
    startTransition(async () => {
      const res = await resetPasswordAction(formData);
      setResult(res);
    });
  }

  if (!token) {
    return (
      <p className="text-sm text-ink/70">
        This reset link is invalid. Please request a new one.
      </p>
    );
  }

  if (result?.success) {
    return (
      <>
        <p className="text-sm text-ink/70">{result.message}</p>
        <Link
          href="/login"
          className="mt-4 block rounded-md bg-maroon px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-maroon-dark"
        >
          Log In
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormField label="New password" name="password" type="password" autoComplete="new-password" />
      <FormField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" />

      {result?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{result.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-maroon px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-maroon-dark disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set New Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Reset Password">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthCard>
  );
}
