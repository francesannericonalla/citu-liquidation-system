"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { FormField } from "@/components/FormField";
import { signUpAction } from "@/features/auth/actions";

export default function SignUpPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await signUpAction(formData);
      if (res.success) {
        router.push("/login?registered=1");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <AuthCard title="Create Account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Full name" name="name" autoComplete="name" />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@cit.edu"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
        />

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-maroon px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-maroon-dark disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Sign Up"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ink/50">
        Already have an account?{" "}
        <Link href="/login" className="text-maroon hover:text-maroon-dark">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
