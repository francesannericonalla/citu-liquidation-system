import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Top bar */}
      <header className="bg-maroon">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <span className="text-base font-semibold tracking-wide text-white">
            CIT-U Liquidation System
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-semibold text-ink">
            Liquidation System
          </h1>
          <span className="mx-auto mt-2 block h-[3px] w-12 rounded-full bg-gold" />
          <p className="mt-4 text-sm text-ink/60">
            Internal expense reporting for Cebu Institute of Technology –
            University. Sign in with your <span className="font-medium">@cit.edu</span> account.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/login"
              className="block rounded-md bg-maroon px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-maroon-dark"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="block rounded-md border border-maroon px-4 py-2.5 text-sm font-medium text-maroon transition-colors hover:bg-bg-subtle"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
