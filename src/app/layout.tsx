import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { Providers } from "./providers";
import { Header } from "~/components/layout/Header";
import { ViewportCheck } from "~/components/layout/ViewportCheck";

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
      <body className="min-h-screen bg-[#FDFFFC] dark:bg-[#2d2e2e]">
        <Providers>
          <ViewportCheck>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
          </ViewportCheck>
        </Providers>
      </body>
    </html>
  );
}
