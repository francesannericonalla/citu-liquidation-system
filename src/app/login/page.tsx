"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
import { FormField } from "@/components/FormField";
import { loginAction } from "@/features/auth/actions";

function LoginForm() {
  const [pending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const error = searchParams.get("error");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => loginAction(formData));
  }

  return (
    <AuthCard title="Log In">
      {justRegistered && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
          Account created — log in to select your office.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          Invalid email or password.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-maroon hover:text-maroon-dark"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-maroon px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-maroon-dark disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Log In"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ink/50">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-maroon hover:text-maroon-dark">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
