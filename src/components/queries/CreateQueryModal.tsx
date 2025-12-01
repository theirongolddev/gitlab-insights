"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  Heading,
  Input,
  Label,
  Modal,
  ModalOverlay,
  TextField,
  Button as AriaButton,
} from "react-aria-components";
import { Button } from "@heroui/react";
import { api } from "~/trpc/react";

/**
 * CreateQueryModal Props Interface
 *
 * Story 2.8.5: Save as Query Entry Points
 * AC 2.8.5.3: Modal opens with keywords pre-filled
 */
export interface CreateQueryModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Pre-filled keywords to save */
  keywords: string[];
}

/**
 * CreateQueryModal Component
 *
 * Story 2.8.5: Save as Query Entry Points
 * AC 2.8.5.3: Modal opens with keywords pre-filled, auto-focuses name input
 * AC 2.8.5.4: 's' keyboard shortcut triggers modal (handled in Header.tsx via ShortcutContext)
 *
 * Behavior:
 * - Auto-focuses name input on open
 * - Displays keywords as read-only tag pills (reuses SearchBar olive styling)
 * - Calls queries.create mutation on Save
 * - Invalidates queries.list on success to update sidebar immediately
 * - Closes on Save success, Cancel click, or Esc key (React Aria default)
 * - Shows error message if mutation fails
 * - isDismissable={true} allows clicking outside modal or pressing Esc to close
 *
 * Keyboard Shortcuts:
 * - 's' key: Opens modal (when keywords active, not typing) - registered in Header.tsx
 * - Enter key: Submits form when focused in name input
 * - Esc key: Closes modal (React Aria ModalOverlay default with isDismissable)
 */
export function CreateQueryModal({
  isOpen,
  onClose,
  keywords,
}: CreateQueryModalProps) {
  const [queryName, setQueryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const utils = api.useUtils();

  /**
   * Validates query name input
   * @param name - The query name to validate
   * @returns Error message if invalid, null if valid
   */
  const validateQueryName = (name: string): string | null => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "Query name is required";
    }

    if (trimmedName.length > 100) {
      return "Query name must be 100 characters or less";
    }

    return null;
  };

  // Consolidated form reset logic
  const resetForm = () => {
    setQueryName("");
    setError(null);
    setTouched(false);
  };

  const createQuery = api.queries.create.useMutation({
    onSuccess: () => {
      // Invalidate queries list to update sidebar immediately
      void utils.queries.list.invalidate();

      // Close modal and reset form
      resetForm();
      onClose();
    },
    onError: (err) => {
      // Provide specific error messages based on error type
      const errorMessage = err.message;

      if (errorMessage?.includes("unique constraint") || errorMessage?.includes("already exists")) {
        setError("A query with this name already exists. Please choose a different name.");
      } else if (errorMessage?.includes("validation")) {
        setError("Invalid query name. Please check your input.");
      } else if (errorMessage?.includes("permission") || errorMessage?.includes("unauthorized")) {
        setError("You don't have permission to create queries.");
      } else {
        setError(errorMessage ?? "Failed to save query. Please try again.");
      }
    },
  });

  const handleSave = () => {
    const validationError = validateQueryName(queryName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    createQuery.mutate({
      name: queryName.trim(),
      filters: { keywords },
    });
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  // Reset form when modal closes (including Esc key press)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  // Validate on blur
  const handleBlur = () => {
    setTouched(true);
    const validationError = validateQueryName(queryName);
    if (validationError) {
      setError(validationError);
    }
  };

  // Clear validation error when user types
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryName(e.target.value);
    if (touched && error) {
      setError(null);
    }
  };

  // Check if input should show error state
  const showValidationError = touched && !queryName.trim();

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      // Allows clicking backdrop or pressing Esc to close modal
      isDismissable
      className="
        fixed inset-0 z-50
        bg-black/50
        flex items-center justify-center
        p-4
      "
    >
      <Modal
        className="
          bg-white dark:bg-gray-800
          rounded-lg shadow-xl
          p-6 max-w-md w-full mx-4
          outline-none
        "
      >
        <Dialog
          className="outline-none"
          aria-label="Save Query"
        >
          {({ close }) => (
            <>
              <Heading
                slot="title"
                className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-50"
              >
                Save as Query
              </Heading>

              <div className="space-y-4">
                {/* Query Name Input - auto-focus on open */}
                <TextField
                  autoFocus
                  isRequired
                  className="flex flex-col gap-2"
                >
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Query Name <span className="text-red-600 dark:text-red-400">*</span>
                  </Label>
                  <Input
                    value={queryName}
                    onChange={handleNameChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Auth Discussions"
                    className={`
                      px-3 py-2
                      bg-gray-100 dark:bg-gray-700
                      text-gray-900 dark:text-gray-50
                      border rounded-md
                      outline-none
                      placeholder:text-gray-500
                      transition-colors duration-150
                      ${showValidationError
                        ? "border-red-500 dark:border-red-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        : "border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-olive-light focus:border-transparent"
                      }
                    `}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSave();
                      } else if (e.key === "Escape") {
                        // Allow Esc to bubble to modal for dismissal
                        handleCancel();
                      }
                    }}
                  />
                </TextField>

                {/* Keywords Display - Read-only tag pills */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search Keywords
                  </label>
                  <div className="
                    flex flex-wrap gap-1.5
                    min-h-[40px] px-3 py-2
                    bg-gray-100 dark:bg-gray-700
                    border border-gray-300 dark:border-gray-600
                    rounded-md
                  ">
                    {keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="
                          inline-flex items-center gap-1 px-2 py-0.5
                          text-sm font-medium rounded-full
                          bg-olive-light/15 border border-olive-light/50 dark:bg-olive-light/20 dark:border-olive-light
                          text-olive dark:text-gray-50
                        "
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    role="alert"
                    className="
                      px-3 py-2
                      bg-red-50 dark:bg-red-900/20
                      border border-red-200 dark:border-red-800
                      rounded-md
                      text-sm text-red-800 dark:text-red-300
                    "
                  >
                    {error}
                  </div>
                )}

                {/* Action Buttons - HeroUI Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    onPress={handleCancel}
                    color="default"
                    variant="flat"
                  >
                    Cancel
                  </Button>

                  <Button
                    onPress={handleSave}
                    color="primary"
                    isLoading={createQuery.isPending}
                    isDisabled={createQuery.isPending}
                  >
                    {createQuery.isPending ? "Saving..." : "Save Query"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
