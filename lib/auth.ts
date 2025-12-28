import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database", // Use database sessions for security
    maxAge: 60 * 60, // 1 hour (in seconds)
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user }) {
      // Allowlist of authorized email addresses from environment variable
      // Format: comma-separated list (e.g., "email1@example.com,email2@example.com")
      const allowedEmailsEnv = process.env.ALLOWED_EMAILS || "";
      const allowedEmails = allowedEmailsEnv
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (allowedEmails.length === 0) {
        console.warn(
          "ALLOWED_EMAILS environment variable is not set or empty. No users will be able to sign in.",
        );
        return false;
      }

      return user.email ? allowedEmails.includes(user.email) : false;
    },
    authorized: async ({ auth }) => {
      // Returns true if the user is authenticated
      return !!auth;
    },
  },
});
