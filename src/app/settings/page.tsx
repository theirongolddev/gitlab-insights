"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/Button";
import { ProjectSelector } from "~/components/projects/ProjectSelector";

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch user's current monitored projects
  const { data: monitoredProjects, isLoading: isLoadingMonitored } =
    api.projects.getMonitored.useQuery(undefined, {
      enabled: !!session,
    });

  // Fetch all available GitLab projects
  const { data: allProjects, isLoading: isLoadingProjects, error: projectsError } =
    api.gitlab.listUserProjects.useQuery(undefined, {
      enabled: !!session,
    });

  // For settings, initial selection is the currently monitored projects
  const initialSelectedIds = useMemo(() => {
    return new Set(monitoredProjects?.map(p => p.gitlabProjectId) ?? []);
  }, [monitoredProjects]);

  // Current selection (starts as monitored projects, then tracks user changes)
  const currentSelection = selectedProjectIds ?? initialSelectedIds;

  // Save monitored projects mutation
  const saveMonitoredMutation = api.projects.saveMonitored.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      setSaveError(null);
      setIsSubmitting(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (error) => {
      setSaveError(error.message);
      setSaveSuccess(false);
      setIsSubmitting(false);
    },
  });

  // Handle selection change - clear feedback messages
  const handleSelectionChange = (newSelection: Set<string>) => {
    setSelectedProjectIds(newSelection);
    setSaveSuccess(false);
    setSaveError(null);
  };

  // Handle save
  const handleSave = () => {
    if (!allProjects) return;

    setIsSubmitting(true);
    setSaveError(null);

    const selectedProjectsData = allProjects
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FDFFFC] dark:bg-[#2d2e2e]">
        <p className="text-xl text-[#2d2e2e] dark:text-[#FDFFFC]">Loading...</p>
      </main>
    );
  }

  // Unauthenticated redirect
  if (!session) {
    router.push("/");
    return null;
  }

  const isLoading = isLoadingMonitored || isLoadingProjects;

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col bg-[#FDFFFC] dark:bg-[#2d2e2e]">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto px-4 py-8 pb-32">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#2d2e2e] dark:text-[#FDFFFC]">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your GitLab Insights preferences
            </p>
          </div>

          {/* Monitored Projects Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[#2d2e2e] dark:text-[#FDFFFC]">
              Monitored Projects
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Select which GitLab projects you want to track in your dashboard.
            </p>

            {/* Loading state */}
            {isLoading && (
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#9DAA5F] border-r-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your projects...</p>
              </div>
            )}

            {/* Error state */}
            {projectsError && (
              <div className="rounded-lg border border-red-600 bg-red-50 p-6 dark:bg-red-900/20">
                <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-400">
                  Error Loading Projects
                </h3>
                <p className="text-red-700 dark:text-red-300">{projectsError.message}</p>
              </div>
            )}

            {/* Empty state */}
            {allProjects && allProjects.length === 0 && (
              <div className="rounded-lg border border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-4 text-lg text-[#2d2e2e] dark:text-[#FDFFFC]">
                  No projects found
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  You don&apos;t have access to any GitLab projects yet.
                </p>
              </div>
            )}

            {/* Project selector */}
            {allProjects && allProjects.length > 0 && !isLoading && (
              <ProjectSelector
                projects={allProjects}
                initialSelectedIds={initialSelectedIds}
                onSelectionChange={handleSelectionChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Sticky footer - always visible */}
      {allProjects && allProjects.length > 0 && !isLoading && (
        <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-[#2d2e2e] dark:text-[#FDFFFC]">{currentSelection.size}</span> of {allProjects.length} projects selected
              </span>
              {saveSuccess && (
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  ✓ Projects updated successfully
                </span>
              )}
              {saveError && (
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  ✕ {saveError}
                </span>
              )}
            </div>
            <Button
              variant="primary"
              onPress={handleSave}
              isDisabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
