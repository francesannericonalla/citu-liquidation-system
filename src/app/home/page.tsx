import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "@/features/auth/actions";

const ALL_CARDS = [
  {
    label: "Liquidations",
    path: "/liquidations",
    desc: "Create and manage liquidation reports",
    roles: ["Encoder", "Admin"] as string[],
  },
  {
    label: "Repository",
    path: "/repository",
    desc: "Search all liquidations across offices",
    roles: ["Encoder", "Admin"] as string[],
  },
  {
    label: "Dashboard",
    path: "/dashboard",
    desc: "Spend summaries and status counts",
    roles: ["Encoder", "Admin"] as string[],
  },
  {
    label: "Admin",
    path: "/admin/approvals",
    desc: "Approve sign-ups, manage users",
    roles: ["Admin"] as string[],
  },
];

export default async function HomePage() {
  const session = await auth();
  if (!session?.user || session.user.approvalStatus !== "active") {
    redirect("/pending-approval");
  }

  const { role, name } = session.user;
  const cards = ALL_CARDS.filter((c) => c.roles.includes(role));

  return (
    <>
      {/* Top bar */}
      <header className="bg-maroon text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-0">
          <div className="flex items-center gap-3 py-4">
            <span className="text-base font-semibold tracking-wide">CIT-U Liquidation System</span>
          </div>
          <nav>
            <ul className="flex items-stretch gap-1">
              {cards.map((c) => (
                <li key={c.path}>
                  <a
                    href={c.path}
                    className="group relative flex h-full items-center px-4 py-4 text-sm font-medium text-white/80 transition-colors hover:text-white"
                  >
                    {c.label}
                    <span className="absolute bottom-0 left-0 h-[3px] w-full scale-x-0 bg-gold transition-transform group-hover:scale-x-100" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Log Out
            </button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-ink">
            Welcome{name ? `, ${name.split(" ")[0]}` : ""}
            <span className="mt-1 block h-[3px] w-10 rounded-full bg-gold" />
          </h1>
          <p className="max-w-prose text-sm text-ink/60">
            {role === "Admin"
              ? "You have Admin access — all offices visible."
              : "Select a module to get started."}
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="group rounded-lg border border-border bg-bg p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="font-semibold text-maroon group-hover:text-maroon-dark">
                {item.label}
              </p>
              <p className="mt-1 text-xs text-ink/60">{item.desc}</p>
            </a>
          ))}
        </section>
      </main>
    </>
  );
}
