import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { approvalStatus, requestedOfficeId } = session.user;

  if (approvalStatus === "active") {
    redirect("/home");
  }

  if (!requestedOfficeId) {
    redirect("/select-office");
  }

  redirect("/pending-approval");
}
