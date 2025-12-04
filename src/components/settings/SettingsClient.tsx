"use client";

import { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { Button } from "@heroui/react";
import { ProjectSelectionLayout } from "~/components/projects/ProjectSelectionLayout";

export function SettingsClient() {
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch user's current monitored projects (session already validated by server component)
  const { data: monitoredProjects, isLoading: isLoadingMonitored } =
    api.projects.getMonitored.useQuery();

  // Fetch all available GitLab projects
  const { data: allProjects, isLoading: isLoadingProjects, error: projectsError } =
    api.gitlab.listUserProjects.useQuery();

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

  return (
    <ProjectSelectionLayout
      title="Settings"
      description="Manage your GitLab Insights preferences and select which projects to monitor."
      projects={allProjects}
      isLoading={isLoadingMonitored || isLoadingProjects}
      error={projectsError}
      initialSelectedIds={initialSelectedIds}
      onSelectionChange={handleSelectionChange}
      currentSelectionSize={currentSelection.size}
      insideAppLayout={true}
      footerContent={
        <>
          {saveSuccess && (
            <span className="text-sm font-medium text-success dark:text-success-dark">
              Projects updated successfully
            </span>
          )}
          {saveError && (
            <span className="text-sm font-medium text-error dark:text-error-dark">
              {saveError}
            </span>
          )}
          <Button
            color="primary"
            onPress={handleSave}
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </>
      }
    />
  );
}
