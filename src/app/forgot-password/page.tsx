"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { FormField } from "@/components/FormField";
import { forgotPasswordAction } from "@/features/auth/actions";

export default function ForgotPasswordPage() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await forgotPasswordAction(formData);
      setResult(res);
    });
  }

  if (result?.success) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm text-ink/70">{result.message}</p>
        <Link href="/login" className="mt-4 block text-center text-xs text-maroon hover:text-maroon-dark">
          Back to Log In
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot Password">
      <p className="mb-4 text-sm text-ink/60">
        Enter your <span className="font-medium">@cit.edu</span> email and we&apos;ll send a reset link.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Email" name="email" type="email" autoComplete="email" placeholder="you@cit.edu" />

        {result?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{result.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-maroon px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-maroon-dark disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <Link href="/login" className="mt-4 block text-center text-xs text-ink/40 hover:text-maroon">
        Back to Log In
      </Link>
    </AuthCard>
  );
}
