"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { ProjectSelector } from "~/components/projects/ProjectSelector";
import { Button, Spinner } from "@heroui/react";

export default function OnboardingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's GitLab projects
  const { data: projects, isLoading: isLoadingProjects, error: projectsError } =
    api.gitlab.listUserProjects.useQuery(undefined, {
      enabled: !!session,
    });

  // For onboarding, all projects are selected by default (opt-out model)
  const initialSelectedIds = useMemo(() => {
    return new Set(projects?.map(p => p.id) ?? []);
  }, [projects]);

  // Current selection (starts as all selected, then tracks user changes)
  const currentSelection = selectedProjectIds ?? initialSelectedIds;

  // Save monitored projects mutation
  const saveMonitoredMutation = api.projects.saveMonitored.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (error) => {
      alert(`Failed to save projects: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const handleContinue = () => {
    if (!projects) return;

    setIsSubmitting(true);

    const selectedProjectsData = projects
      .filter(p => currentSelection.has(p.id))
      .map(p => ({
        gitlabProjectId: p.id,
        projectName: p.name,
        projectPath: p.path_with_namespace,
      }));

    saveMonitoredMutation.mutate({
      projects: selectedProjectsData,
    });
  };

  // Loading state
  if (isPending) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Spinner size="lg" color="primary" />
      </main>
    );
  }

  // Unauthenticated redirect
  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-light dark:bg-bg-dark">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto px-4 py-16 pb-32">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Select Projects to Monitor
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Choose which GitLab projects you want to track. All projects are selected by default.
            </p>
          </div>

          {/* Loading state for projects */}
          {isLoadingProjects && (
            <div className="text-center">
              <Spinner size="lg" color="primary" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your projects...</p>
            </div>
          )}

          {/* Error state */}
          {projectsError && (
            <div className="rounded-lg border border-red-600 bg-red-50 p-6 dark:bg-red-900/20">
              <h2 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-400">
                Error Loading Projects
              </h2>
              <p className="text-red-700 dark:text-red-300">{projectsError.message}</p>
            </div>
          )}

          {/* Empty state */}
          {projects && projects.length === 0 && (
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-4 text-lg text-gray-900 dark:text-gray-50">
                No projects found
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                You don&apos;t have access to any GitLab projects yet. Create a project in GitLab first, or ask for access to existing projects.
              </p>
            </div>
          )}

          {/* Project selector */}
          {projects && projects.length > 0 && (
            <ProjectSelector
              projects={projects}
              initialSelectedIds={initialSelectedIds}
              onSelectionChange={setSelectedProjectIds}
            />
          )}
        </div>
      </div>

      {/* Sticky footer - always visible */}
      {projects && projects.length > 0 && (
        <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-50">{currentSelection.size}</span> of {projects.length} projects selected
              {currentSelection.size === 0 && (
                <span className="ml-2 text-error dark:text-error-dark">
                  — Select at least one to continue
                </span>
              )}
            </div>
            <Button
              color="primary"
              variant="solid"
              size="lg"
              onPress={handleContinue}
              isDisabled={currentSelection.size === 0 || isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Continue →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
