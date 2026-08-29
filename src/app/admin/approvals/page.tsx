import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { ApprovalRow } from "./ApprovalRow";

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "Admin") redirect("/home");

  const pending = await db.user.findMany({
    where: { approval_status: "pending_office_approval" },
    include: { requested_office: { select: { name: true, short_code: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <header className="bg-maroon">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <a href="/home" className="text-base font-semibold tracking-wide text-white hover:text-white/80">
            CIT-U Liquidation System
          </a>
          <span className="mx-3 text-white/30">›</span>
          <span className="text-sm text-white/70">Admin — Pending Approvals</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-semibold text-ink">
          Pending Approvals
          <span className="mt-1 block h-[3px] w-10 rounded-full bg-gold" />
        </h1>

        {pending.length === 0 ? (
          <p className="mt-8 text-sm text-ink/50">No pending approvals.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-subtle text-left">
                  <th className="px-4 py-3 font-medium text-ink/70">Name</th>
                  <th className="px-4 py-3 font-medium text-ink/70">Email</th>
                  <th className="px-4 py-3 font-medium text-ink/70">Requested Office</th>
                  <th className="px-4 py-3 font-medium text-ink/70">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((user) => (
                  <ApprovalRow
                    key={user.id}
                    userId={user.id}
                    name={user.name}
                    email={user.cit_email}
                    requestedOffice={
                      user.requested_office
                        ? `${user.requested_office.name} (${user.requested_office.short_code})`
                        : null
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
