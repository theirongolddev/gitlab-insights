"use client";

import { Button } from "@heroui/react";

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export function RefreshButton({ onRefresh, isLoading }: RefreshButtonProps) {
  return (
    <Button
      color="primary"
      onPress={() => void onRefresh()}
      isDisabled={isLoading}
      isLoading={isLoading}
    >
      {isLoading ? "Syncing..." : "Refresh"}
    </Button>
  );
}
