import React from "react";

interface HeadingProps {
  children: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: "dark" | "light";
}

interface TextProps {
  children: React.ReactNode;
  className?: string;
  variant?: "body" | "small" | "caption";
  color?: "primary" | "secondary" | "muted" | "light" | "light-secondary";
}

/**
 * Heading component with consistent typography scale
 */
export const Heading: React.FC<HeadingProps> = ({
  children,
  className = "",
  level = 1,
  variant = "dark",
}) => {
  const colorClasses = {
    dark: "text-textcolor-primary",
    light: "text-textcolor-light",
  };

  const baseClasses = `font-bold ${colorClasses[variant]}`;

  const levelClasses = {
    1: "text-3xl sm:text-4xl lg:text-5xl",
    2: "text-2xl sm:text-3xl lg:text-4xl",
    3: "text-xl sm:text-2xl lg:text-3xl",
    4: "text-lg sm:text-xl lg:text-2xl",
    5: "text-base sm:text-lg lg:text-xl",
    6: "text-sm sm:text-base lg:text-lg",
  };

  const combinedClasses = `${baseClasses} ${levelClasses[level]} ${className}`;
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return <Tag className={combinedClasses}>{children}</Tag>;
};

/**
 * Text component with consistent typography variants
 */
export const Text: React.FC<TextProps> = ({
  children,
  className = "",
  variant = "body",
  color = "primary",
}) => {
  const variantClasses = {
    body: "text-base leading-relaxed",
    small: "text-sm",
    caption: "text-xs",
  };

  const colorClasses = {
    primary: "text-textcolor-primary",
    secondary: "text-textcolor-secondary",
    muted: "text-gray-500",
    light: "text-textcolor-light",
    "light-secondary": "text-textcolor-light-secondary",
  };

  const combinedClasses = `${variantClasses[variant]} ${colorClasses[color]} ${className}`;

  return <p className={combinedClasses}>{children}</p>;
};
