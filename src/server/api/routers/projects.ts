import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

/**
 * Projects Router
 *
 * Handles user's monitored project selections
 * - Save project selections (delete + insert in transaction)
 * - Get monitored projects
 */

export const projectsRouter = createTRPCRouter({
  /**
   * Save user's monitored project selections
   *
   * Atomically replaces all monitored projects for the user:
   * 1. Delete existing MonitoredProject records
   * 2. Insert new MonitoredProject records
   *
   * @param projectIds - Array of GitLab project IDs to monitor
   * @returns Count of saved projects
   */
  saveMonitored: protectedProcedure
    .input(
      z.object({
        projects: z.array(
          z.object({
            gitlabProjectId: z.string(),
            projectName: z.string(),
            projectPath: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        // Use Prisma transaction for atomic delete + insert
        const result = await ctx.db.$transaction(async (tx) => {
          // Delete all existing monitored projects for this user
          await tx.monitoredProject.deleteMany({
            where: {
              userId,
            },
          });

          // Insert new monitored projects
          if (input.projects.length > 0) {
            await tx.monitoredProject.createMany({
              data: input.projects.map((project) => ({
                userId,
                gitlabProjectId: project.gitlabProjectId,
                projectName: project.projectName,
                projectPath: project.projectPath,
              })),
            });
          }

          return { count: input.projects.length };
        });

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save monitored projects",
          cause: error,
        });
      }
    }),

  /**
   * Get user's monitored projects
   *
   * @returns Array of monitored projects
   */
  getMonitored: protectedProcedure.query(async ({ ctx }) => {
    const monitoredProjects = await ctx.db.monitoredProject.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      select: {
        id: true,
        gitlabProjectId: true,
        projectName: true,
        projectPath: true,
        createdAt: true,
      },
      orderBy: {
        projectName: "asc",
      },
    });

    return monitoredProjects;
  }),
});
