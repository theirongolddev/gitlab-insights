/**
 * UI Components - Barrel Export
 *
 * Re-exports all shared UI components for convenient importing:
 *
 * ```tsx
 * import { Shimmer, AnimatedList, SuccessCheckmark } from "~/components/ui";
 * ```
 */

// Loading States
export { Shimmer, ShimmerText, ShimmerCard, ShimmerList } from "./Shimmer";

// Animation Wrappers
export { AnimatedList, AnimatedItem } from "./AnimatedList";

// Feedback Components
export {
  SuccessCheckmark,
  AnimatedSuccess,
  SuccessMessage,
} from "./SuccessCheckmark";

// GitLab Markdown
export { GitLabMarkdown } from "./GitLabMarkdown";
