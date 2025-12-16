"use client";

import { useState } from "react";
import { Chip, Divider } from "@heroui/react";
import { api } from "~/trpc/react";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { PersonCard } from "~/components/people/PersonCard";

interface FileExplorerProps {
  projectId: string;
}

export function FileExplorer({ projectId }: FileExplorerProps) {
  const [currentDirectory, setCurrentDirectory] = useState("/");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const { data: directoryData, isLoading } = api.files.listDirectory.useQuery({
    projectId,
    directory: currentDirectory,
  });

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Files
          </h2>

          <Breadcrumb
            path={currentDirectory}
            onNavigate={setCurrentDirectory}
          />

          {isLoading ? (
            <LoadingSpinner size="md" label="Loading..." />
          ) : (
            <div className="mt-4 space-y-1">
              {directoryData?.subdirectories.map((subdir) => (
                <DirectoryItem
                  key={subdir}
                  path={subdir}
                  onClick={() => setCurrentDirectory(subdir)}
                />
              ))}
              {directoryData?.files.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  isSelected={selectedFileId === file.id}
                  onClick={() => setSelectedFileId(file.id)}
                />
              ))}
              {directoryData?.subdirectories.length === 0 &&
                directoryData?.files.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No files in this directory
                  </p>
                )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedFileId ? (
          <FileDetailPanel fileId={selectedFileId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select a file to view details
          </div>
        )}
      </div>
    </div>
  );
}

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const parts = path === "/" ? [""] : path.split("/");

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => onNavigate("/")}
        className="text-olive-light hover:underline"
      >
        root
      </button>
      {parts.slice(1).map((part, index) => {
        const fullPath = "/" + parts.slice(1, index + 2).join("/");
        return (
          <span key={fullPath} className="flex items-center gap-1">
            <span className="text-gray-400">/</span>
            <button
              onClick={() => onNavigate(fullPath)}
              className="text-olive-light hover:underline"
            >
              {part}
            </button>
          </span>
        );
      })}
    </div>
  );
}

interface DirectoryItemProps {
  path: string;
  onClick: () => void;
}

function DirectoryItem({ path, onClick }: DirectoryItemProps) {
  const name = path.split("/").pop() ?? path;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 p-2 rounded-lg text-left
                 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <span className="text-yellow-500">📁</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {name}
      </span>
    </button>
  );
}

interface FileItemProps {
  file: {
    id: string;
    filename: string;
    extension: string | null;
    commitCount: number;
  };
  isSelected: boolean;
  onClick: () => void;
}

function FileItem({ file, isSelected, onClick }: FileItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left
                  transition-colors ${
                    isSelected
                      ? "bg-olive-light/10 ring-1 ring-olive-light"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-gray-400">📄</span>
        <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
          {file.filename}
        </span>
      </div>
      <Chip size="sm" variant="flat">
        {file.commitCount} commits
      </Chip>
    </button>
  );
}

interface FileDetailPanelProps {
  fileId: string;
}

function FileDetailPanel({ fileId }: FileDetailPanelProps) {
  const { data: commits, isLoading: commitsLoading } =
    api.files.getCommits.useQuery({ fileId, limit: 20 });

  const { data: contributors, isLoading: contributorsLoading } =
    api.files.getContributors.useQuery({ fileId });

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        File Details
      </h3>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Contributors
        </h4>
        {contributorsLoading ? (
          <LoadingSpinner size="sm" />
        ) : contributors?.items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No contributors found
          </p>
        ) : (
          <div className="space-y-2">
            {contributors?.items.slice(0, 5).map((c) => (
              <div key={c.person.id} className="flex items-center justify-between">
                <PersonCard person={c.person} variant="compact" showActivity={false} />
                <Chip size="sm" variant="flat">
                  {c.commitCount} commits
                </Chip>
              </div>
            ))}
          </div>
        )}
      </div>

      <Divider className="my-4" />

      <div>
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Recent Commits
        </h4>
        {commitsLoading ? (
          <LoadingSpinner size="sm" />
        ) : commits?.items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No commits found
          </p>
        ) : (
          <div className="space-y-3">
            {commits?.items.map((commit) => (
              <CommitItem key={commit.id} commit={commit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommitItemProps {
  commit: {
    id: string;
    shortSha: string;
    title: string;
    authoredAt: Date;
    webUrl: string;
    changeType: string;
    person?: {
      username: string;
      name: string | null;
    } | null;
  };
}

function CommitItem({ commit }: CommitItemProps) {
  const changeColors: Record<string, "success" | "warning" | "danger" | "default"> = {
    added: "success",
    modified: "warning",
    deleted: "danger",
    renamed: "default",
  };

  return (
    <a
      href={commit.webUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700
                 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {commit.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {commit.person?.name ?? commit.person?.username ?? "Unknown"} •{" "}
            {new Date(commit.authoredAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            color={changeColors[commit.changeType] ?? "default"}
            variant="flat"
          >
            {commit.changeType}
          </Chip>
          <code className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {commit.shortSha}
          </code>
        </div>
      </div>
    </a>
  );
}
