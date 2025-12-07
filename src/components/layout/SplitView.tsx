"use client";

import { ReactNode } from 'react';
import { useDetailPane } from '~/hooks/useDetailPane';
import { useMediaQuery } from '~/hooks/useMediaQuery';
import { cn } from '~/lib/utils';

interface SplitViewProps {
  listContent: ReactNode;
  detailContent: ReactNode;
  selectedEventId: string | null;
}

/**
 * Split pane layout component for event list/detail view
 *
 * Features:
 * - Responsive 60/40 split layout (list/detail)
 * - Smooth 200ms transitions
 * - Mobile-aware (hides detail pane on mobile)
 * - Integrates with useDetailPane hook for state management
 *
 * @param listContent - Left pane content (event table)
 * @param detailContent - Right pane content (event details)
 * @param selectedEventId - Currently selected event ID (null = no selection)
 *
 * @example
 * <SplitView
 *   listContent={<EventTable />}
 *   detailContent={<EventDetail eventId={selectedId} />}
 *   selectedEventId={selectedId}
 * />
 */
export function SplitView({ listContent, detailContent, selectedEventId }: SplitViewProps) {
  const { isOpen } = useDetailPane();
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="flex h-full">
      {/* List/Table Section */}
      <div className={cn(
        "transition-all duration-200",
        isOpen && !isMobile ? "w-3/5" : "w-full"
      )}>
        {listContent}
      </div>

      {/* Detail Pane */}
      {isOpen && !isMobile && selectedEventId && (
        <div className="w-2/5 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
          {detailContent}
        </div>
      )}
    </div>
  );
}
