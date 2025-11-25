"use client";

import { Button as AriaButton } from "react-aria-components";
import type { ButtonProps as AriaButtonProps } from "react-aria-components";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<AriaButtonProps, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#5e6b24] text-white hover:bg-[#4F5A1F] dark:bg-[#5e6b24] dark:text-white dark:hover:bg-[#4F5A1F]",
  secondary:
    "bg-gray-200 text-[#2d2e2e] hover:bg-gray-300 dark:bg-gray-800 dark:text-[#FDFFFC] dark:hover:bg-gray-700",
  ghost:
    "bg-transparent text-[#2d2e2e] border border-gray-300 hover:bg-gray-100 dark:text-[#FDFFFC] dark:border-gray-600 dark:hover:bg-gray-800",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  isDisabled,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      {...props}
      isDisabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        rounded-lg font-medium
        transition-colors
        focus:outline-none focus:ring-2 focus:ring-[#9DAA5F] focus:ring-offset-2 dark:focus:ring-offset-[#2d2e2e]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
    >
      {children}
    </AriaButton>
  );
}
