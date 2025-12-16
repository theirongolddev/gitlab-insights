"use client";

import { useState } from "react";
import { Select, SelectItem } from "@heroui/react";
import { api } from "~/trpc/react";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { FileExplorer } from "./FileExplorer";

export function FilesPageClient() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: projects, isLoading: projectsLoading } =
    api.projects.getMonitored.useQuery();

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" label="Loading projects..." />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500 dark:text-gray-400">
        <p className="text-lg">No monitored projects found</p>
        <p className="text-sm mt-2">Add a project to start exploring files</p>
      </div>
    );
  }

  const currentProjectId = selectedProjectId ?? projects[0]?.gitlabProjectId;

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - var(--header-height, 64px))' }}>
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              File Explorer
            </h1>
            <Select
              label="Project"
              selectedKeys={currentProjectId ? [currentProjectId] : []}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              size="sm"
              className="w-64"
            >
              {projects.map((project) => (
                <SelectItem key={project.gitlabProjectId}>
                  {project.projectName}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {currentProjectId ? (
          <FileExplorer projectId={currentProjectId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select a project to explore files
          </div>
        )}
      </div>
    </div>
  );
}
