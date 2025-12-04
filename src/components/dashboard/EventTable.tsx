"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableColumn,
  type Selection,
} from "@heroui/react";
import { ItemRow, type DashboardEvent } from "./ItemRow";
import { useShortcuts } from "../keyboard/ShortcutContext";

interface EventTableProps {
  events: DashboardEvent[];
  onRowClick?: (event: DashboardEvent) => void;
}

/**
 * EventTable - HeroUI Table with vim-style j/k navigation
 *
 * MIGRATION (Story 1.5.4): Migrated from React Aria to HeroUI Table
 * - Uses HeroUI Table, TableHeader, TableBody, TableRow, TableCell components
 * - Preserves vim-style j/k navigation via ShortcutContext integration
 * - Uses HeroUI color="primary" for olive focus rings
 * - Maintains WCAG 2.1 Level AA accessibility compliance
 * - Integrates with existing ItemRow component (Epic 1)
 */
export function EventTable({ events, onRowClick }: EventTableProps) {
  // Task 1.4: selectedKeys state for single-selection mode
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());

  // Task 3: Ref for focus management - use wrapper div since React Aria Table
  // doesn't expose onKeyDown directly
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Task 3: Get shortcut handlers from context
  const { setMoveSelectionDown, setMoveSelectionUp, setJumpHalfPageDown, setJumpHalfPageUp } = useShortcuts();

  // Number of rows to jump for half-page navigation (Ctrl+d/Ctrl+u)
  const HALF_PAGE_JUMP = 10;

  // Use refs to avoid stale closure issues with selection state
  const eventsRef = useRef(events);
  const selectedKeysRef = useRef(selectedKeys);

  // Keep refs in sync with state
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    selectedKeysRef.current = selectedKeys;

    // Scroll selected row into view
    if (selectedKeys !== "all" && (selectedKeys as Set<string>).size > 0) {
      const selectedId = Array.from(selectedKeys as Set<string>)[0];
      // Find the row element by its data-key attribute (React Aria sets this)
      const rowElement = wrapperRef.current?.querySelector(
        `[data-key="${selectedId}"]`
      );
      if (rowElement) {
        rowElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedKeys]);

  // Helper to get current selected index - uses refs for current values
  const getSelectedIndex = useCallback((): number => {
    const currentEvents = eventsRef.current;
    const currentSelectedKeys = selectedKeysRef.current;

    if (currentSelectedKeys === "all" || currentEvents.length === 0) return -1;
    const selectedSet = currentSelectedKeys as Set<string>;
    if (selectedSet.size === 0) return -1;
    const selectedId = Array.from(selectedSet)[0];
    return currentEvents.findIndex((e) => e.id === selectedId);
  }, []);

  // Task 2.4: Selection movement logic - uses refs for current values
  const moveSelection = useCallback(
    (direction: "up" | "down", count: number = 1) => {
      const currentEvents = eventsRef.current;
      if (currentEvents.length === 0) return; // Task 3.6: Empty state no-op

      const currentIndex = getSelectedIndex();
      let newIndex: number;

      if (direction === "down") {
        // Handle edge case - already at or past last item
        if (currentIndex === currentEvents.length - 1) return;
        if (currentIndex === -1) {
          newIndex = Math.min(count - 1, currentEvents.length - 1);
        } else {
          newIndex = Math.min(currentIndex + count, currentEvents.length - 1);
        }
      } else {
        // Handle edge case - already at first item
        if (currentIndex === 0) return;
        if (currentIndex === -1) return; // Nothing selected, up does nothing
        newIndex = Math.max(currentIndex - count, 0);
      }

      const newEvent = currentEvents[newIndex];
      if (newEvent) {
        setSelectedKeys(new Set([newEvent.id]));
      }
    },
    [getSelectedIndex]
  );

  // Task 3: Focus Router Pattern - register handlers with ShortcutContext
  // Only register once since moveSelection uses refs for current state
  useEffect(() => {
    // Helper to ensure table has focus before navigation
    const ensureFocus = () => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(document.activeElement)
      ) {
        wrapperRef.current.focus();
      }
    };

    // Task 3.4: Register moveSelectionDown handler (j key)
    setMoveSelectionDown(() => {
      ensureFocus();
      moveSelection("down");
    });

    // Task 3.5: Register moveSelectionUp handler (k key)
    setMoveSelectionUp(() => {
      ensureFocus();
      moveSelection("up");
    });

    // Register Ctrl+d handler (half-page down)
    setJumpHalfPageDown(() => {
      ensureFocus();
      moveSelection("down", HALF_PAGE_JUMP);
    });

    // Register Ctrl+u handler (half-page up)
    setJumpHalfPageUp(() => {
      ensureFocus();
      moveSelection("up", HALF_PAGE_JUMP);
    });
  }, [setMoveSelectionDown, setMoveSelectionUp, setJumpHalfPageDown, setJumpHalfPageUp, moveSelection, HALF_PAGE_JUMP]);


  // Task 6.4: Empty state handling
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">No events to display</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Try syncing your GitLab projects
        </p>
      </div>
    );
  }

  return (
    // Task 3.3: Wrapper div for focus management (j/k handled by global ShortcutHandler)
    <div
      ref={wrapperRef}
      tabIndex={0}
      className="outline-none"
      onKeyDown={(e) => {
        // Handle Enter key on selected row
        if (e.key === "Enter") {
          const currentIndex = getSelectedIndex();
          if (currentIndex >= 0 && currentIndex < events.length) {
            const event = events[currentIndex];
            if (event && onRowClick) {
              onRowClick(event);
            }
          }
        }
      }}
    >
      <Table
        aria-label="Events table"
        className="w-full"
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        color="primary" // HeroUI: Olive theme color for selection
        classNames={{
          wrapper: "p-0 shadow-none bg-transparent",
          th: "sr-only", // Hide header visually (screen reader accessible)
          tr: "cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-800 data-[selected=true]:bg-olive/10 dark:data-[selected=true]:bg-olive-light/15",
          td: "p-0"
        }}
        onRowAction={(key) => {
          // Handle Enter key press on selected row
          const event = events.find((e) => e.id === key);
          if (event && onRowClick) {
            onRowClick(event);
          }
        }}
      >
        <TableHeader>
          <TableColumn>Event</TableColumn>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <ItemRow
                  item={event}
                  isSelected={
                    selectedKeys !== "all" &&
                    (selectedKeys as Set<string>).has(event.id)
                  }
                  isNew={false}
                  onClick={() => onRowClick?.(event)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
