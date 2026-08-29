import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") redirect("/pending-approval");

  const { role, name } = session.user;

  return (
    <AppShell activePath="/home">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
          </h1>
          <span className="mt-1 block h-[3px] w-10 rounded-full bg-gold" />
          <p className="mt-2 text-sm text-ink/60">
            {role === "Admin" ? "Admin view — all offices visible." : "Select a module to get started."}
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/liquidations/new" className="group rounded-lg border border-border bg-white p-5 shadow-sm hover:shadow-md">
            <p className="font-semibold text-maroon group-hover:text-maroon-dark">New Liquidation</p>
            <p className="mt-1 text-xs text-ink/60">Start a new expense liquidation report</p>
          </Link>
          <Link href="/liquidations" className="group rounded-lg border border-border bg-white p-5 shadow-sm hover:shadow-md">
            <p className="font-semibold text-maroon group-hover:text-maroon-dark">Liquidations</p>
            <p className="mt-1 text-xs text-ink/60">View and manage your office liquidations</p>
          </Link>
          <Link href="/repository" className="group rounded-lg border border-border bg-white p-5 shadow-sm hover:shadow-md">
            <p className="font-semibold text-maroon group-hover:text-maroon-dark">Repository</p>
            <p className="mt-1 text-xs text-ink/60">Browse all liquidation records</p>
          </Link>
          {role === "Admin" && (
            <Link href="/admin/approvals" className="group rounded-lg border border-border bg-white p-5 shadow-sm hover:shadow-md">
              <p className="font-semibold text-maroon group-hover:text-maroon-dark">Admin — Approvals</p>
              <p className="mt-1 text-xs text-ink/60">Review pending sign-up requests</p>
            </Link>
          )}
        </section>
      </div>
    </AppShell>
  );
}
