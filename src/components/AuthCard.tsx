import type { ReactNode } from "react";
import Link from "next/link";

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-maroon">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <Link
            href="/"
            className="text-base font-semibold tracking-wide text-white hover:text-white/80"
          >
            CIT-U Liquidation System
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-ink">
            {title}
            <span className="mt-1 block h-[3px] w-8 rounded-full bg-gold" />
          </h1>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
