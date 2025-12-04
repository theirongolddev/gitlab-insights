"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { api } from "~/trpc/react";
import { Button, Spinner } from "@heroui/react";
import { ProjectSelectionLayout } from "~/components/projects/ProjectSelectionLayout";

export function OnboardingClient() {
  const router = useRouter();
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already has monitored projects (skip onboarding if so)
  const { data: monitoredProjects, isLoading: isLoadingMonitored } =
    api.projects.getMonitored.useQuery();

  // Redirect to dashboard if user already has projects selected
  useEffect(() => {
    if (!isLoadingMonitored && monitoredProjects && monitoredProjects.length > 0) {
      router.replace("/dashboard");
    }
  }, [monitoredProjects, isLoadingMonitored, router]);

  // Fetch user's GitLab projects (session already validated by server component)
  const { data: projects, isLoading: isLoadingProjects, error: projectsError } =
    api.gitlab.listUserProjects.useQuery();

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

  // Show loading while checking for monitored projects
  if (isLoadingMonitored) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  // Show loading while redirecting to dashboard
  if (monitoredProjects && monitoredProjects.length > 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <ProjectSelectionLayout
      title="Select Projects to Monitor"
      description="Choose which GitLab projects you want to track. All projects are selected by default."
      projects={projects}
      isLoading={isLoadingProjects}
      error={projectsError}
      initialSelectedIds={initialSelectedIds}
      onSelectionChange={setSelectedProjectIds}
      currentSelectionSize={currentSelection.size}
      footerContent={
        <>
          {currentSelection.size === 0 && (
            <span className="text-sm text-error dark:text-error-dark">
              Select at least one to continue
            </span>
          )}
          <Button
            color="primary"
            variant="solid"
            size="lg"
            onPress={handleContinue}
            isDisabled={currentSelection.size === 0 || isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </>
      }
    />
  );
}
