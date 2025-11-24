"use client";

import { signIn, signOut, useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FDFFFC] dark:bg-[#2d2e2e]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-[#2d2e2e] dark:text-[#FDFFFC] sm:text-[5rem]">
          GitLab <span className="text-[#5e6b24] dark:text-[#9DAA5F]">Insights</span>
        </h1>
        <p className="text-xl text-[#2d2e2e] dark:text-[#FDFFFC]">
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
        <p className="text-center text-2xl text-[#2d2e2e] dark:text-[#FDFFFC]">
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
      <p className="text-center text-2xl text-[#2d2e2e] dark:text-[#FDFFFC]">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {!sessionData && <span>Not logged in</span>}
      </p>
      <button
        className="rounded-full bg-[#5e6b24] px-10 py-3 font-semibold text-[#FDFFFC] no-underline transition hover:bg-[#4F5A1F] dark:bg-[#9DAA5F] dark:text-[#2d2e2e] dark:hover:bg-[#A8B86C]"
        onClick={sessionData ? () => void handleSignOut() : () => void handleSignIn()}
      >
        {sessionData ? "Sign out" : "Sign in with GitLab"}
      </button>
    </div>
  );
}
