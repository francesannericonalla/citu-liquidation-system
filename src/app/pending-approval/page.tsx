import { auth } from "@/lib/auth";
import { AuthCard } from "@/components/AuthCard";
import { logoutAction } from "@/features/auth/actions";

export default async function PendingApprovalPage() {
  const session = await auth();
  const status = session?.user?.approvalStatus;
  const isRejected = status === "rejected";

  return (
    <AuthCard title={isRejected ? "Access Denied" : "Awaiting Approval"}>
      {isRejected ? (
        <p className="text-sm text-ink/70">
          Your access request was not approved. Contact your office
          administrator for assistance.
        </p>
      ) : (
        <p className="text-sm text-ink/70">
          Your access request is pending review by an Admin. You&apos;ll be
          able to access the system once approved.
        </p>
      )}

      <form action={logoutAction} className="mt-6">
        <button
          type="submit"
          className="w-full rounded-md border border-border px-4 py-2 text-sm text-ink/60 transition-colors hover:bg-bg-subtle"
        >
          Log Out
        </button>
      </form>
    </AuthCard>
  );
}
