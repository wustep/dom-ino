import type { CSSProperties } from "react";

/**
 * Build a background style object that correctly handles both
 * gradient strings and solid colors.
 */
export function getBackgroundStyle(background?: string): CSSProperties {
  if (!background) return {};
  return background.includes("gradient")
    ? { background }
    : { backgroundColor: background };
}
