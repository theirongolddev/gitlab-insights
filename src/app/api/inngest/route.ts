/**
 * Inngest Webhook Route (App Router)
 *
 * This route handles Inngest webhook requests for function invocation.
 * Uses Next.js App Router route handlers (not Pages Router).
 *
 * The serve() function from inngest/next automatically handles:
 * - GET: Inngest dashboard introspection
 * - POST: Function invocation from Inngest cloud/dev server
 * - PUT: Function registration
 */
import { serve } from "inngest/next";
import { inngest } from "~/inngest/client";
import { apiPollingJob } from "~/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [apiPollingJob],
});
