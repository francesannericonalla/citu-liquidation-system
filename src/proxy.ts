import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Public routes that never require a session.
const PUBLIC = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

// next-auth v5: export the `auth` wrapper as `proxy` (Next.js 16 convention).
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // Always pass through public routes and Next.js/auth internals.
  if (PUBLIC.has(pathname) || pathname.startsWith("/api/auth") || pathname === "/api/offices") {
    return NextResponse.next();
  }

  const session = req.auth;

  // 1. Not signed in → /login
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { approvalStatus, accountStatus, role, requestedOfficeId } = session.user;

  // 2. Deactivated → /login
  if (accountStatus === "deactivated") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Needs to pick an office first → /select-office
  if (approvalStatus === "pending_office_approval" && !requestedOfficeId) {
    if (pathname !== "/select-office") {
      return NextResponse.redirect(new URL("/select-office", req.url));
    }
    return NextResponse.next();
  }

  // 4. Pending office approval (office chosen) or rejected → /pending-approval
  if (approvalStatus === "pending_office_approval" || approvalStatus === "rejected") {
    if (pathname !== "/pending-approval") {
      return NextResponse.redirect(new URL("/pending-approval", req.url));
    }
    return NextResponse.next();
  }

  // 5. Active Encoder trying to reach Admin-only routes → /home
  if (pathname.startsWith("/admin") && role !== "Admin") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
