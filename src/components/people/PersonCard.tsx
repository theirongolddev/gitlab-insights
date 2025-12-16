"use client";

import { Avatar, Card, CardBody, Chip } from "@heroui/react";
import { PersonActivityStats, type PersonStats } from "./PersonActivityStats";

export interface Person {
  id: string;
  gitlabId: number;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface PersonCardProps {
  person: Person;
  stats?: PersonStats;
  variant?: "default" | "compact" | "detailed";
  isSelected?: boolean;
  onClick?: () => void;
  showActivity?: boolean;
}

export function PersonCard({
  person,
  stats,
  variant = "default",
  isSelected = false,
  onClick,
  showActivity = true,
}: PersonCardProps) {
  const displayName = person.name ?? person.username;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (variant === "compact") {
    return (
      <div
        onClick={onClick}
        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
          hover:bg-gray-100 dark:hover:bg-gray-800
          ${isSelected ? "ring-2 ring-olive-light bg-gray-50 dark:bg-gray-800" : ""}`}
      >
        <Avatar
          src={person.avatarUrl ?? undefined}
          name={initials}
          size="sm"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">
            {displayName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
            @{person.username}
          </span>
        </div>
        {showActivity && stats && (
          <PersonActivityStats stats={stats} compact />
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <Card
        isPressable={!!onClick}
        onPress={onClick}
        className={`w-full ${isSelected ? "ring-2 ring-olive-light" : ""}`}
      >
        <CardBody className="p-4">
          <div className="flex items-start gap-4">
            <Avatar
              src={person.avatarUrl ?? undefined}
              name={initials}
              size="lg"
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {displayName}
              </h3>
              <Chip
                size="sm"
                variant="flat"
                className="mt-1"
                classNames={{
                  content: "text-xs",
                }}
              >
                @{person.username}
              </Chip>
              {showActivity && stats && (
                <div className="mt-3">
                  <PersonActivityStats stats={stats} />
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      isPressable={!!onClick}
      onPress={onClick}
      className={`w-full ${isSelected ? "ring-2 ring-olive-light" : ""}`}
    >
      <CardBody className="p-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={person.avatarUrl ?? undefined}
            name={initials}
            size="md"
            className="shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                @{person.username}
              </span>
            </div>
            {showActivity && stats && (
              <div className="mt-1">
                <PersonActivityStats stats={stats} compact />
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
