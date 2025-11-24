import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession } from "next-auth";
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
      clientId: env.GITLAB_CLIENT_ID,
      clientSecret: env.GITLAB_CLIENT_SECRET,
      authorization: {
        url: `${env.GITLAB_INSTANCE_URL}/oauth/authorize`,
        params: {
          scope: "read_api read_user",
        },
      },
      token: `${env.GITLAB_INSTANCE_URL}/oauth/token`,
      userinfo: `${env.GITLAB_INSTANCE_URL}/api/v4/user`,
      // TODO (Epic 3): Add profile() callback to validate required fields (id, email, name, avatar_url)
      // TODO (Epic 3): Add scope validation on first login to verify read_api and read_user permissions
    }),
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database" as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    session: ({ session, user }: { session: any; user: any }) => {
      // Add user ID to session for database queries
      // TODO (Epic 6): Replace 'any' types with proper NextAuth v5 callback types when available
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      };
    },
    // TODO (Epic 3): Add jwt() callback for token refresh logic
    // TODO (Epic 6): Add signIn() callback for custom error handling:
    //   - 401: Expired/revoked token → prompt re-authentication with clear message
    //   - 403: Insufficient permissions → show scope requirements error
    //   - Network errors → show connection error with retry
  },
  pages: {
    signIn: "/",
    newUser: "/onboarding",
  },
};
