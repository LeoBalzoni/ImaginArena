import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * Responsive container component with consistent max-widths and padding
 * Follows mobile-first responsive design principles
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  className = "",
  size = "lg",
}) => {
  const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  const baseClasses = "mx-auto px-4 sm:px-6 lg:px-8";
  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${className}`;

  return <div className={combinedClasses}>{children}</div>;
};
