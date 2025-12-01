"use client";

import { signIn, signOut, useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@heroui/react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-light dark:bg-bg-dark">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 sm:text-[5rem]">
          GitLab <span className="text-olive dark:text-olive-light">Insights</span>
        </h1>
        <p className="text-xl text-gray-800 dark:text-gray-100">
          Attention-efficient discovery platform for GitLab
        </p>
        <AuthShowcase />
      </div>
    </main>
  );
}

function AuthShowcase() {
  const { data: sessionData, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (sessionData) {
      router.push("/onboarding");
    }
  }, [sessionData, router]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-center text-2xl text-gray-800 dark:text-gray-100">
          Loading...
        </p>
      </div>
    );
  }

  const handleSignIn = async () => {
    await signIn.social({
      provider: "gitlab",
      callbackURL: "/onboarding",
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-gray-800 dark:text-gray-100">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {!sessionData && <span>Not logged in</span>}
      </p>
      <Button
        color="primary"
        size="lg"
        className="rounded-full px-10 font-semibold"
        onPress={sessionData ? () => void handleSignOut() : () => void handleSignIn()}
      >
        {sessionData ? "Sign out" : "Sign in with GitLab"}
      </Button>
    </div>
  );
}
