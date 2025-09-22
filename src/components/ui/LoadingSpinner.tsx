import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent" | "white";
  text?: string;
}

/**
 * Animated loading spinner component with consistent styling
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
  text,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
    white: "text-white",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <Loader2
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
      />
      {text && (
        <p className={`text-sm ${colorClasses[color]} animate-pulse`}>{text}</p>
      )}
    </motion.div>
  );
};
