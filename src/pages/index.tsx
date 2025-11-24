import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>GitLab Insights</title>
        <meta name="description" content="GitLab activity feed and insights" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FDFFFC] dark:bg-[#2d2e2e]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#2d2e2e] dark:text-[#FDFFFC] sm:text-[5rem]">
            GitLab <span className="text-[#5e6b24] dark:text-[#9DAA5F]">Insights</span>
          </h1>
          <p className="text-xl text-[#2d2e2e] dark:text-[#FDFFFC]">
            Database schema initialized. Ready for GitLab OAuth setup.
          </p>
          <AuthShowcase />
        </div>
      </main>
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-[#2d2e2e] dark:text-[#FDFFFC]">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {!sessionData && <span>Not logged in</span>}
      </p>
      <button
        className="rounded-full bg-[#5e6b24] px-10 py-3 font-semibold text-[#FDFFFC] no-underline transition hover:bg-[#4F5A1F] dark:bg-[#9DAA5F] dark:text-[#2d2e2e] dark:hover:bg-[#A8B86C]"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
