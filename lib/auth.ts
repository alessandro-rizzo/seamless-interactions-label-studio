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
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user }) {
      // Allowlist of authorized email addresses
      const allowedEmails = ["l.alessandrorizzo@gmail.com"];

      return user.email ? allowedEmails.includes(user.email) : false;
    },
    authorized: async ({ auth }) => {
      // Returns true if the user is authenticated
      return !!auth;
    },
  },
});
