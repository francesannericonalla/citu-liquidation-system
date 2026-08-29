import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "@/features/auth/actions";

const NAV_LINKS = [
  { label: "Liquidations", path: "/liquidations", roles: ["Encoder", "Admin"] },
  { label: "Repository",   path: "/repository",   roles: ["Encoder", "Admin"] },
  { label: "Dashboard",    path: "/dashboard",    roles: ["Encoder", "Admin"] },
  { label: "Approvals",    path: "/admin/approvals", roles: ["Admin"] },
  { label: "Users",        path: "/admin/users",     roles: ["Admin"] },
] as const;

interface Props {
  children: React.ReactNode;
  activePath?: string;
}

export async function AppShell({ children, activePath }: Props) {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") redirect("/pending-approval");

  const { role, name } = session.user;
  const links = NAV_LINKS.filter((l) => (l.roles as readonly string[]).includes(role));

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5]">
      {/* Top nav */}
      <header className="sticky top-0 z-20 bg-maroon shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <Link href="/home" className="py-4 text-sm font-bold tracking-wide text-white">
            CIT-U Liquidation System
          </Link>

          <nav className="flex items-stretch">
            {links.map((l) => {
              const isActive = activePath?.startsWith(l.path);
              return (
                <Link
                  key={l.path}
                  href={l.path}
                  className={`group relative flex items-center px-4 py-4 text-sm font-medium transition-colors ${
                    isActive ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute bottom-0 left-0 h-[3px] w-full bg-gold transition-transform ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60">{name}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
              >
                Log Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8">
        {children}
      </main>
    </div>
  );
}
