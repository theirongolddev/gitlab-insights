"use client";

import { useState, useMemo } from "react";

export interface GitLabProject {
  id: string;
  name: string;
  path_with_namespace: string;
  description: string | null;
}

export interface ProjectSelectorProps {
  /** All available projects to select from */
  projects: GitLabProject[];
  /** IDs of initially selected projects */
  initialSelectedIds: Set<string>;
  /** Called when selection changes */
  onSelectionChange: (selectedIds: Set<string>) => void;
}

/**
 * Reusable project selection UI with search, bulk actions, and grouped display.
 * Used by both onboarding and settings pages.
 */
export function ProjectSelector({
  projects,
  initialSelectedIds,
  onSelectionChange,
}: ProjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // Track modifications from initial state
  const [modifications, setModifications] = useState<Map<string, boolean>>(new Map());

  // Derive current selection by applying modifications to initial state
  const selectedIds = useMemo(() => {
    const selected = new Set(initialSelectedIds);
    modifications.forEach((isSelected, projectId) => {
      if (isSelected) {
        selected.add(projectId);
      } else {
        selected.delete(projectId);
      }
    });
    return selected;
  }, [initialSelectedIds, modifications]);

  // Notify parent of selection changes
  const updateSelection = (newModifications: Map<string, boolean>) => {
    setModifications(newModifications);
    // Compute new selection and notify parent
    const newSelected = new Set(initialSelectedIds);
    newModifications.forEach((isSelected, projectId) => {
      if (isSelected) {
        newSelected.add(projectId);
      } else {
        newSelected.delete(projectId);
      }
    });
    onSelectionChange(newSelected);
  };

  // Handle individual checkbox toggle
  const handleToggleProject = (projectId: string) => {
    const newModifications = new Map(modifications);
    const currentlySelected = selectedIds.has(projectId);
    newModifications.set(projectId, !currentlySelected);
    updateSelection(newModifications);
  };

  // Handle "Select All" button
  const handleSelectAll = () => {
    const newModifications = new Map<string, boolean>();
    projects.forEach(p => {
      if (!initialSelectedIds.has(p.id)) {
        newModifications.set(p.id, true);
      }
    });
    updateSelection(newModifications);
  };

  // Handle "Deselect All" button
  const handleDeselectAll = () => {
    const newModifications = new Map<string, boolean>();
    projects.forEach(p => {
      if (initialSelectedIds.has(p.id)) {
        newModifications.set(p.id, false);
      }
    });
    updateSelection(newModifications);
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.path_with_namespace.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  });

  // Group projects by namespace
  const groupedProjects = filteredProjects.reduce((acc, project) => {
    const namespace = project.path_with_namespace.split('/').slice(0, -1).join('/') || 'Personal';
    if (!acc[namespace]) {
      acc[namespace] = [];
    }
    acc[namespace].push(project);
    return acc;
  }, {} as Record<string, GitLabProject[]>);

  return (
    <>
      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-[#2d2e2e] placeholder-gray-400 focus:border-[#9DAA5F] focus:outline-none focus:ring-2 focus:ring-[#9DAA5F] dark:border-gray-600 dark:bg-gray-700 dark:text-[#FDFFFC] dark:placeholder-gray-500"
        />
      </div>

      {/* Bulk action buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleSelectAll}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Select All
        </button>
        <button
          onClick={handleDeselectAll}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Deselect All
        </button>
      </div>

      {/* Project checklist grouped by namespace */}
      <div className="space-y-6">
        {Object.entries(groupedProjects).sort(([a], [b]) => a.localeCompare(b)).map(([namespace, namespaceProjects]) => (
          <div key={namespace} className="rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800">
            {/* Namespace header */}
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {namespace}
              </h3>
            </div>

            {/* Projects in namespace */}
            <div className="p-4 space-y-1">
              {namespaceProjects.map((project) => (
                <label
                  key={project.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(project.id)}
                    onChange={() => handleToggleProject(project.id)}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-[#9DAA5F] focus:ring-2 focus:ring-[#9DAA5F] focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#2d2e2e] dark:text-[#FDFFFC]">
                      {project.name}
                    </div>
                    {project.description && (
                      <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {project.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
