"use client";

import { useEffect, useState } from "react";

const MIN_VIEWPORT_WIDTH = 1280;

export function ViewportCheck({ children }: { children: React.ReactNode }) {
  const [isSmallViewport, setIsSmallViewport] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkViewport = () => {
      setIsSmallViewport(window.innerWidth < MIN_VIEWPORT_WIDTH);
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);

    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Don't render anything during SSR to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  if (isSmallViewport) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#2d2e2e] px-8 text-center">
        <div className="max-w-md">
          <h1 className="mb-4 text-2xl font-bold text-[#FDFFFC]">
            Desktop or Laptop Required
          </h1>
          <p className="mb-6 text-gray-400">
            GitLab Insights is optimized for desktop and laptop browsers with a
            minimum viewport width of {MIN_VIEWPORT_WIDTH}px.
          </p>
          <p className="text-sm text-gray-500">
            Please resize your browser window or switch to a larger screen to
            continue.
          </p>
          <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
            <p className="text-xs text-gray-400">
              Current width:{" "}
              <span className="font-mono text-[#9DAA5F]">
                {typeof window !== "undefined" ? window.innerWidth : 0}px
              </span>
            </p>
            <p className="text-xs text-gray-400">
              Required:{" "}
              <span className="font-mono text-[#9DAA5F]">
                {MIN_VIEWPORT_WIDTH}px+
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
