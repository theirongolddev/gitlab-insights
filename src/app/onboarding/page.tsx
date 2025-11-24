"use client";

import { useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Header } from "~/components/layout/Header";
import { api } from "~/trpc/react";

export default function OnboardingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user's GitLab projects
  const { data: projects, isLoading: isLoadingProjects, error: projectsError } =
    api.gitlab.listUserProjects.useQuery(undefined, {
      enabled: !!session,
    });

  // Save monitored projects mutation
  const saveMonitoredMutation = api.projects.saveMonitored.useMutation({
    onSuccess: () => {
      // Redirect to dashboard after successful save
      router.push("/dashboard");
    },
    onError: (error) => {
      alert(`Failed to save projects: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Initialize all projects as selected when data loads (opt-out model)
  useEffect(() => {
    if (projects && selectedProjects.size === 0) {
      setSelectedProjects(new Set(projects.map(p => p.id)));
    }
  }, [projects]);

  // Handle individual checkbox toggle
  const handleToggleProject = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Handle "Select All" button
  const handleSelectAll = () => {
    if (projects) {
      setSelectedProjects(new Set(projects.map(p => p.id)));
    }
  };

  // Handle "Deselect All" button
  const handleDeselectAll = () => {
    setSelectedProjects(new Set());
  };

  // Filter projects based on search query
  const filteredProjects = projects?.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.path_with_namespace.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  });

  // Group projects by namespace for better visual hierarchy
  const groupedProjects = filteredProjects?.reduce((acc, project) => {
    const namespace = project.path_with_namespace.split('/').slice(0, -1).join('/') || 'Personal';
    if (!acc[namespace]) {
      acc[namespace] = [];
    }
    acc[namespace].push(project);
    return acc;
  }, {} as Record<string, typeof filteredProjects>);

  // Handle form submission
  const handleContinue = async () => {
    if (!projects) return;

    setIsSubmitting(true);

    const selectedProjectsData = projects
      .filter(p => selectedProjects.has(p.id))
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

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center bg-[#FDFFFC] dark:bg-[#2d2e2e] px-4 py-16">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#2d2e2e] dark:text-[#FDFFFC]">
              Select Projects to Monitor
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Choose which GitLab projects you want to track. All projects are selected by default.
            </p>
          </div>

          {/* Loading state for projects */}
          {isLoadingProjects && (
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#9DAA5F] border-r-transparent"></div>
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
              <p className="mb-4 text-lg text-[#2d2e2e] dark:text-[#FDFFFC]">
                No projects found
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have access to any GitLab projects yet. Create a project in GitLab first, or ask for access to existing projects.
              </p>
            </div>
          )}

          {/* Project list */}
          {projects && projects.length > 0 && (
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
                <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                  {selectedProjects.size} of {projects.length} selected
                </div>
              </div>

              {/* Project checklist grouped by namespace */}
              <div className="mb-8 space-y-6">
                {groupedProjects && Object.entries(groupedProjects).sort(([a], [b]) => a.localeCompare(b)).map(([namespace, namespaceProjects]) => (
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
                            checked={selectedProjects.has(project.id)}
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

              {/* Continue button */}
              <div className="flex justify-center">
                <button
                  onClick={handleContinue}
                  disabled={selectedProjects.size === 0 || isSubmitting}
                  className="rounded-md bg-[#9DAA5F] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#A8B86C] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#9DAA5F] dark:hover:bg-[#A8B86C]"
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                </button>
              </div>

              {selectedProjects.size === 0 && (
                <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
                  Please select at least one project to continue
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
