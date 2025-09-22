import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

/**
 * Reusable Button component with consistent styling and animations
 * Supports multiple variants, sizes, and loading states
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className = "",
  ...props
}) => {
  const baseClasses =
    "font-semibold rounded-xl shadow transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-primary text-white hover:bg-primary-600 hover:shadow-glow focus:ring-4 focus:ring-primary-200",
    secondary:
      "bg-secondary text-white hover:bg-secondary-600 hover:shadow-glow-secondary focus:ring-4 focus:ring-secondary-200",
    accent:
      "bg-accent text-white hover:bg-accent-600 hover:shadow-glow-accent focus:ring-4 focus:ring-accent-200",
    outline:
      "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white focus:ring-4 focus:ring-primary-200",
    ghost:
      "text-textcolor-primary hover:bg-gray-100 shadow-none focus:ring-4 focus:ring-gray-200",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    // @ts-ignore
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
};
