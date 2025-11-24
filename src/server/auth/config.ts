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
    }),
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database" as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    session: ({ session, user }: any) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  pages: {
    signIn: "/",
    newUser: "/onboarding",
  },
};
