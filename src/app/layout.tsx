import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { Providers } from "./providers";
import { Header } from "~/components/layout/Header";
import { AppLayout } from "~/components/layout/AppLayout";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitLab Insights",
  description: "Attention-efficient GitLab discovery platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <head>
        {/* 
          FOUC Prevention Script - Must execute before React hydration
          CRITICAL: Storage key 'gitlab-insights-theme' MUST match THEME_STORAGE_KEY in /src/lib/theme.ts
          If the key changes there, update it here to prevent theme mismatch on page load
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Key must match THEME_STORAGE_KEY in /src/lib/theme.ts
                  const stored = localStorage.getItem('gitlab-insights-theme');
                  const preference = stored || 'system';

                  let theme = preference;
                  if (preference === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches
                      ? 'dark'
                      : 'light';
                  }

                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  // localStorage might be disabled
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-100 dark:bg-bg-dark" suppressHydrationWarning>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <AppLayout>{children}</AppLayout>
          </div>
        </Providers>
      </body>
    </html>
  );
}
