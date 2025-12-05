"use client";

/**
 * Login Page
 * 
 * Story 6-2: Route Architecture Refactor
 * - Dedicated login route for unauthenticated users
 * - Simple GitLab OAuth sign-in button
 * - Middleware redirects authenticated users to /dashboard
 */

import { signIn, useSession } from "~/lib/auth-client";
import { Button } from "@heroui/react";

export default function LoginPage() {
  const { isPending } = useSession();

  const handleSignIn = async () => {
    await signIn.social({
      provider: "gitlab",
      callbackURL: "/dashboard",
    });
  };

  // Show loading while session is being checked
  // Middleware will redirect if already authenticated
  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-center text-2xl text-gray-800 dark:text-gray-100">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 sm:text-[5rem]">
          GitLab <span className="text-olive dark:text-olive-light">Insights</span>
        </h1>
        <p className="text-xl text-gray-800 dark:text-gray-100">
          Attention-efficient discovery platform for GitLab
        </p>
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-center text-2xl text-gray-800 dark:text-gray-100">
            Sign in to get started
          </p>
          <Button
            color="primary"
            size="lg"
            className="rounded-full px-10 font-semibold"
            onPress={() => void handleSignIn()}
          >
            Sign in with GitLab
          </Button>
        </div>
      </div>
    </div>
  );
}
