import React from "react";
import { Heading, Text } from "./Typography";

interface DarkAwareHeadingProps {
  children: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  onDark?: boolean;
}

interface DarkAwareTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: "body" | "small" | "caption";
  onDark?: boolean;
  muted?: boolean;
}

/**
 * Smart heading component that automatically uses light text on dark backgrounds
 * Use onDark={true} when the heading is placed on dark backgrounds like gradients, dark cards, etc.
 */
export const DarkAwareHeading: React.FC<DarkAwareHeadingProps> = ({
  children,
  className = "",
  level = 1,
  onDark = false,
}) => {
  return (
    <Heading
      level={level}
      variant={onDark ? "light" : "dark"}
      className={className}
    >
      {children}
    </Heading>
  );
};

/**
 * Smart text component that automatically uses light text on dark backgrounds
 * Use onDark={true} when the text is placed on dark backgrounds like gradients, dark cards, etc.
 */
export const DarkAwareText: React.FC<DarkAwareTextProps> = ({
  children,
  className = "",
  variant = "body",
  onDark = false,
  muted = false,
}) => {
  let color: "primary" | "secondary" | "muted" | "light" | "light-secondary";

  if (onDark) {
    color = muted ? "light-secondary" : "light";
  } else {
    color = muted ? "secondary" : "primary";
  }

  return (
    <Text variant={variant} color={color} className={className}>
      {children}
    </Text>
  );
};
