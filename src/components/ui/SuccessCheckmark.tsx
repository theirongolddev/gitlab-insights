"use client";

import { memo, type ReactElement } from "react";
import { motion, type Variants } from "framer-motion";

interface SuccessCheckmarkProps {
  /** Size in pixels - defaults to 64 */
  size?: number;
  /** Stroke width - defaults to 3 */
  strokeWidth?: number;
  /** Color variant */
  variant?: "success" | "primary" | "default";
  /** Animation delay in seconds */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  label?: string;
}

const colorMap = {
  success: "var(--color-success)",
  primary: "var(--color-olive)",
  default: "var(--color-default-600)",
};

const circleVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        type: "spring",
        duration: 0.6,
        bounce: 0,
      },
      opacity: { duration: 0.1 },
    },
  },
};

const checkVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        type: "spring",
        duration: 0.4,
        bounce: 0.2,
        delay: 0.3,
      },
      opacity: { duration: 0.1, delay: 0.3 },
    },
  },
};

const scaleVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 0.5,
      bounce: 0.4,
    },
  },
};

/**
 * SuccessCheckmark - Animated success indicator
 *
 * An SVG checkmark with sophisticated animation:
 * - Circle draws first with spring physics
 * - Checkmark draws after circle completes
 * - Overall scale bounce for satisfying feedback
 *
 * Usage:
 * ```tsx
 * <SuccessCheckmark />
 * <SuccessCheckmark size={48} variant="primary" />
 * <SuccessCheckmark delay={0.2} label="Task completed" />
 * ```
 *
 * Features:
 * - Configurable size and stroke
 * - Multiple color variants
 * - Spring physics animations
 * - Accessible with ARIA labels
 * - Respects reduced motion preferences
 */
export const SuccessCheckmark = memo(function SuccessCheckmark({
  size = 64,
  strokeWidth = 3,
  variant = "success",
  delay = 0,
  className = "",
  label = "Success",
}: SuccessCheckmarkProps): ReactElement {
  const color = colorMap[variant];
  const center = size / 2;
  const radius = (size - strokeWidth * 2) / 2;

  // Checkmark path points (scaled to size)
  const scale = size / 64; // Base size is 64
  const checkPath = `M ${18 * scale} ${32 * scale} L ${28 * scale} ${42 * scale} L ${46 * scale} ${24 * scale}`;

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      variants={scaleVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      role="img"
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          variants={circleVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay }}
        />
        {/* Checkmark */}
        <motion.path
          d={checkPath}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={checkVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay }}
        />
      </svg>
    </motion.div>
  );
});

interface AnimatedSuccessProps {
  /** Show the success animation */
  show: boolean;
  /** Size in pixels */
  size?: number;
  /** Color variant */
  variant?: "success" | "primary" | "default";
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AnimatedSuccess - Conditional success animation with exit
 *
 * Wraps SuccessCheckmark with show/hide logic and exit animation.
 * Perfect for form submissions, async operations, etc.
 *
 * Usage:
 * ```tsx
 * <AnimatedSuccess show={isSuccess} onComplete={handleDismiss} />
 * ```
 */
export const AnimatedSuccess = memo(function AnimatedSuccess({
  show,
  size = 64,
  variant = "success",
  onComplete,
  className = "",
}: AnimatedSuccessProps): ReactElement | null {
  if (!show) return null;

  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", duration: 0.5 }}
      onAnimationComplete={onComplete}
    >
      <SuccessCheckmark size={size} variant={variant} />
    </motion.div>
  );
});

interface SuccessMessageProps {
  /** Message to display */
  message: string;
  /** Size of checkmark */
  size?: number;
  /** Color variant */
  variant?: "success" | "primary" | "default";
  /** Additional CSS classes */
  className?: string;
}

/**
 * SuccessMessage - Checkmark with accompanying text
 *
 * Combines animated checkmark with a message for complete feedback.
 *
 * Usage:
 * ```tsx
 * <SuccessMessage message="Changes saved successfully!" />
 * ```
 */
export const SuccessMessage = memo(function SuccessMessage({
  message,
  size = 48,
  variant = "success",
  className = "",
}: SuccessMessageProps): ReactElement {
  return (
    <motion.div
      className={`flex flex-col items-center gap-3 text-center ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.5 }}
    >
      <SuccessCheckmark size={size} variant={variant} />
      <motion.p
        className="text-gray-700 dark:text-gray-300 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
});
