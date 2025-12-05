"use client";

import { Spinner } from "@heroui/react";
import { ProjectSelector, type GitLabProject } from "~/components/projects/ProjectSelector";

interface ProjectSelectionLayoutProps {
  // Header content
  title: string;
  description: string;
  
  // Data
  projects: GitLabProject[] | undefined;
  isLoading: boolean;
  error: { message: string } | null;
  
  // Selection state
  initialSelectedIds: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  currentSelectionSize: number;
  
  // Footer
  footerContent: React.ReactNode;
  
  // Optional: for settings page which renders inside AuthenticatedLayout
  insideAuthenticatedLayout?: boolean;
}

export function ProjectSelectionLayout({
  title,
  description,
  projects,
  isLoading,
  error,
  initialSelectedIds,
  onSelectionChange,
  currentSelectionSize,
  footerContent,
  insideAuthenticatedLayout = false,
}: ProjectSelectionLayoutProps) {
  const minHeightClass = insideAuthenticatedLayout 
    ? "min-h-[calc(100vh-65px)]" 
    : "min-h-screen";

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex ${minHeightClass} flex-col items-center justify-center`}>
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className={`flex ${minHeightClass} flex-col`}>
      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto px-4 py-8 pb-32">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              {title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-red-600 bg-red-50 p-6 dark:bg-red-900/20">
              <h2 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-400">
                Error Loading Projects
              </h2>
              <p className="text-red-700 dark:text-red-300">{error.message}</p>
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
              onSelectionChange={onSelectionChange}
            />
          )}
        </div>
      </div>

      {/* Fixed footer - always visible at bottom */}
      {projects && projects.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-50">{currentSelectionSize}</span> of {projects.length} projects selected
              </span>
            </div>
            {footerContent}
          </div>
        </div>
      )}
    </div>
  );
}
