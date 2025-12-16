import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { gitlabRouter } from "~/server/api/routers/gitlab";
import { projectsRouter } from "~/server/api/routers/projects";
import { eventsRouter } from "~/server/api/routers/events";
import { queriesRouter } from "~/server/api/routers/queries";
import { peopleRouter } from "~/server/api/routers/people";
import { workItemsRouter } from "~/server/api/routers/work-items";
import { filesRouter } from "~/server/api/routers/files";
import { expertiseRouter } from "~/server/api/routers/expertise";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  gitlab: gitlabRouter,
  projects: projectsRouter,
  events: eventsRouter,
  queries: queriesRouter,
  people: peopleRouter,
  workItems: workItemsRouter,
  files: filesRouter,
  expertise: expertiseRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
