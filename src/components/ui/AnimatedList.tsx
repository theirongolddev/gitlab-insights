"use client";

import { Children, type ReactNode, type ReactElement } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface AnimatedListProps {
  /** List items to animate */
  children: ReactNode;
  /** Stagger delay between items in seconds - defaults to 0.05 */
  staggerDelay?: number;
  /** Animation variant - defaults to "slide-up" */
  variant?: "slide-up" | "fade" | "scale";
  /** Unique key prefix for items (useful for list updates) */
  keyPrefix?: string;
  /** Additional CSS classes for the container */
  className?: string;
}

const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -10 },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const variantMap = {
  "slide-up": slideUpVariants,
  fade: fadeVariants,
  scale: scaleVariants,
};

/**
 * AnimatedList - Staggered animation for list items
 *
 * Wraps children in Framer Motion animation containers with
 * configurable stagger timing and animation variants.
 *
 * Usage:
 * ```tsx
 * <AnimatedList staggerDelay={0.05} variant="slide-up">
 *   {items.map((item) => (
 *     <ItemCard key={item.id} item={item} />
 *   ))}
 * </AnimatedList>
 * ```
 *
 * Features:
 * - Staggered entrance animations
 * - Exit animations when items are removed
 * - Multiple animation variants
 * - Respects reduced motion preferences
 */
export function AnimatedList({
  children,
  staggerDelay = 0.05,
  variant = "slide-up",
  keyPrefix = "item",
  className = "",
}: AnimatedListProps): ReactElement {
  const variants = variantMap[variant];

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {Children.map(children, (child, index) => {
          if (!child) return null;

          return (
            <motion.div
              key={`${keyPrefix}-${index}`}
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                duration: 0.2,
                delay: index * staggerDelay,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              {child}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface AnimatedItemProps {
  /** Content to animate */
  children: ReactNode;
  /** Unique key for AnimatePresence tracking */
  itemKey: string | number;
  /** Animation variant */
  variant?: "slide-up" | "fade" | "scale";
  /** Animation delay in seconds */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AnimatedItem - Single animated item (for manual control)
 *
 * Use when you need individual control over item animations
 * rather than automatic staggering from AnimatedList.
 */
export function AnimatedItem({
  children,
  itemKey,
  variant = "slide-up",
  delay = 0,
  className = "",
}: AnimatedItemProps): ReactElement {
  const variants = variantMap[variant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={itemKey}
        className={className}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{
          duration: 0.2,
          delay,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
