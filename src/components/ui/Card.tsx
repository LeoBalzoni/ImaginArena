import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

/**
 * Reusable Card component with consistent styling and optional hover effects
 * Perfect for player cards, match cards, and content containers
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  onClick,
  selected = false,
}) => {
  const baseClasses =
    "bg-white dark:bg-background-dark shadow-card rounded-2xl p-6 transition-all duration-200";
  const hoverClasses = hover
    ? "hover:shadow-glow hover:scale-105 cursor-pointer"
    : "";
  const selectedClasses = selected ? "ring-4 ring-primary shadow-glow" : "";
  const clickableClasses = onClick ? "cursor-pointer" : "";

  const combinedClasses = `${baseClasses} ${hoverClasses} ${selectedClasses} ${clickableClasses} ${className}`;

  const cardContent = (
    <div className={combinedClasses} onClick={onClick}>
      {children}
    </div>
  );

  if (hover || onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};
