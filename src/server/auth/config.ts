import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GitLabProvider from "next-auth/providers/gitlab";

import { db } from "~/server/db";
import { env } from "~/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GitLabProvider({
      clientId: env.GITLAB_CLIENT_ID!,
      clientSecret: env.GITLAB_CLIENT_SECRET!,
      issuer: env.GITLAB_INSTANCE_URL,
      authorization: {
        params: {
          scope: "read_api read_user",
        },
      },
    }),
    /**
     * GitLab OAuth provider configured for self-hosted GitLab instance.
     * Requires GITLAB_CLIENT_ID, GITLAB_CLIENT_SECRET, and GITLAB_INSTANCE_URL environment variables.
     * OAuth scopes: read_api (project access), read_user (user profile)
     *
     * @see https://authjs.dev/reference/core/providers/gitlab
     */
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthConfig;
