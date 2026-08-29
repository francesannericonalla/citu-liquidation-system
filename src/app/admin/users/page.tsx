import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { AppShell } from "@/components/AppShell";
import { UserActionButton } from "@/components/admin/UserActionButton";

const APPROVAL_LABELS: Record<string, string> = {
  pending_email_verification: "Pending Email",
  pending_office_approval:    "Pending Approval",
  active:                     "Active",
  rejected:                   "Rejected",
};
const APPROVAL_COLORS: Record<string, string> = {
  pending_email_verification: "bg-gray-100 text-gray-600",
  pending_office_approval:    "bg-amber-50 text-amber-700",
  active:                     "bg-green-50 text-green-700",
  rejected:                   "bg-red-50 text-red-600",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "Admin") redirect("/home");

  const users = await db.user.findMany({
    orderBy: [{ account_status: "asc" }],
    include: {
      office:            { select: { short_code: true } },
      requested_office:  { select: { short_code: true } },
    },
  });

  return (
    <AppShell activePath="/admin">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">User Management</h1>
          <p className="text-sm text-ink/50">{users.length} total users</p>
        </div>
        <a
          href="/admin/approvals"
          className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-[#f8f7f5]"
        >
          Pending Approvals
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-[#f8f7f5] text-xs font-semibold uppercase tracking-wide text-ink/40">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Office</th>
              <th className="px-4 py-3 text-left">Approval</th>
              <th className="px-4 py-3 text-left">Account</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className={user.account_status === "deactivated" ? "opacity-50" : "hover:bg-[#f8f7f5]"}>
                <td className="px-4 py-3 font-medium text-ink">{user.name}</td>
                <td className="px-4 py-3 text-ink/60">{user.cit_email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === "Admin" ? "bg-maroon/10 text-maroon" : "bg-gray-100 text-gray-600"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/60">
                  {user.office?.short_code
                    ?? (user.requested_office ? `${user.requested_office.short_code} (requested)` : "—")}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${APPROVAL_COLORS[user.approval_status]}`}>
                    {APPROVAL_LABELS[user.approval_status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.account_status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                  }`}>
                    {user.account_status === "active" ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {/* Don't show action for the current admin */}
                  {user.id !== session.user.id && (
                    <UserActionButton
                      userId={user.id}
                      currentStatus={user.account_status}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
