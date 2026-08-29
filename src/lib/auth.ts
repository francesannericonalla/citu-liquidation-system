import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import type { Role, ApprovalStatus, AccountStatus } from "@/types";

// Extend the built-in session types so callers get typed user fields.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      approvalStatus: ApprovalStatus;
      accountStatus: AccountStatus;
      officeId: string | null;
      requestedOfficeId: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
    approvalStatus: ApprovalStatus;
    accountStatus: AccountStatus;
    officeId: string | null;
    requestedOfficeId: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { cit_email: credentials.email as string },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash,
        );
        if (!valid) return null;

        // Deactivated accounts can never sign in.
        if (user.account_status === "deactivated") return null;

        return {
          id: user.id,
          name: user.name,
          email: user.cit_email,
          role: user.role as Role,
          approvalStatus: user.approval_status as ApprovalStatus,
          accountStatus: user.account_status as AccountStatus,
          officeId: user.office_id,
          requestedOfficeId: user.requested_office_id,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // First sign-in — populate from the authorize() return value.
        token.id = user.id;
        token.role = user.role;
        token.approvalStatus = user.approvalStatus;
        token.accountStatus = user.accountStatus;
        token.officeId = user.officeId;
        token.requestedOfficeId = user.requestedOfficeId;
      }

      // On every request, re-fetch the user row so deactivations and
      // approval-status changes take effect without waiting for token expiry.
      if (trigger === "update" || !user) {
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            approval_status: true,
            account_status: true,
            office_id: true,
            requested_office_id: true,
            role: true,
          },
        });
        if (!fresh || fresh.account_status === "deactivated") {
          // Signal to the session callback that this token is invalid.
          token.accountStatus = "deactivated";
        } else {
          token.approvalStatus = fresh.approval_status as ApprovalStatus;
          token.accountStatus = fresh.account_status as AccountStatus;
          token.officeId = fresh.office_id;
          token.role = fresh.role as Role;
          token.requestedOfficeId = fresh.requested_office_id;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.approvalStatus = token.approvalStatus as ApprovalStatus;
      session.user.accountStatus = token.accountStatus as AccountStatus;
      session.user.officeId = token.officeId as string | null;
      session.user.requestedOfficeId = token.requestedOfficeId as string | null;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },
});
