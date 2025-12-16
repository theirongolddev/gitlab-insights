"use client";

import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { loggerLink, unstable_httpBatchStreamLink, TRPCClientError } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import SuperJSON from "superjson";

import { type AppRouter } from "~/server/api/root";
import { signOut } from "~/lib/auth-client";

// Track if we're already handling an auth error to prevent multiple redirects
let isHandlingAuthError = false;

/**
 * Handle UNAUTHORIZED errors by signing out and redirecting to login.
 * Called from onError callbacks in QueryClient.
 */
const handleUnauthorizedError = async (error: unknown) => {
  if (isHandlingAuthError) return;

  if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") {
    isHandlingAuthError = true;
    
    // Clear query cache first to prevent in-flight queries
    if (clientQueryClientSingleton) {
      clientQueryClientSingleton.clear();
    }
    
    try {
      await signOut({ fetchOptions: { onSuccess: () => {
        // Redirect to login after sign out
        window.location.href = "/login";
      }}});
    } catch {
      // If signOut fails, force redirect anyway
      window.location.href = "/login";
    }
  }
};

/**
 * Determine if a tRPC error should be retried.
 *
 * Client errors (4xx) are deterministic and should not be retried.
 * Server errors (5xx) and network failures may be transient and can be retried.
 */
const shouldRetryError = (failureCount: number, error: unknown): boolean => {
  // Max 3 retries for any retryable error
  if (failureCount >= 3) {
    return false;
  }

  // Only handle tRPC errors with error codes
  if (!(error instanceof TRPCClientError)) {
    // Network errors (fetch failures, etc.) should retry
    return true;
  }

  const errorCode = error.data?.code;

  // Client errors (4xx) - deterministic, don't retry
  const nonRetryableErrors = [
    "UNAUTHORIZED",      // 401 - triggers logout flow
    "FORBIDDEN",         // 403 - permission denied
    "NOT_FOUND",         // 404 - resource doesn't exist
    "BAD_REQUEST",       // 400 - validation error
    "CONFLICT",          // 409 - duplicate/constraint
    "TOO_MANY_REQUESTS", // 429 - rate limit
  ];

  if (errorCode && nonRetryableErrors.includes(errorCode)) {
    return false;
  }

  // Server errors (5xx) and other errors - retry
  // Includes: INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, TIMEOUT
  return true;
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryError,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: shouldRetryError,
        onError: handleUnauthorizedError,
      },
    },
    queryCache: new QueryCache({
      // Handle UNAUTHORIZED errors from queries (not just mutations)
      onError: handleUnauthorizedError,
    }),
  });

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient());
};

/**
 * Clear all queries from the cache. Call this before signing out
 * to prevent UNAUTHORIZED errors from in-flight queries.
 */
export const clearQueryCache = () => {
  if (clientQueryClientSingleton) {
    clientQueryClientSingleton.clear();
  }
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        unstable_httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers: () => {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </api.Provider>
  );
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
