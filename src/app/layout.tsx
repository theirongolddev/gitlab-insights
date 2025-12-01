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
    <html lang="en" className={geist.className}>
      <body className="min-h-screen bg-bg-light dark:bg-bg-dark">
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
