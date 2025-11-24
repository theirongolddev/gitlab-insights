import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/server/db";
import { env } from "~/env";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  socialProviders: {
    gitlab: {
      clientId: env.GITLAB_CLIENT_ID,
      clientSecret: env.GITLAB_CLIENT_SECRET,
      issuer: env.GITLAB_INSTANCE_URL,
      scope: ["read_api"],
    },
  },
  baseURL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.NEXTAUTH_URL || "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
