"use client";

import { useSyncExternalStore } from "react";

const MIN_VIEWPORT_WIDTH = 1280;

// External store for viewport width - avoids setState in useEffect
function subscribeToViewport(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getViewportSnapshot() {
  return window.innerWidth;
}

function getServerSnapshot() {
  // Return a large value on server to avoid showing the warning during SSR
  return MIN_VIEWPORT_WIDTH;
}

export function ViewportCheck({ children }: { children: React.ReactNode }) {
  const viewportWidth = useSyncExternalStore(
    subscribeToViewport,
    getViewportSnapshot,
    getServerSnapshot
  );

  const isSmallViewport = viewportWidth < MIN_VIEWPORT_WIDTH;

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
                {viewportWidth}px
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
