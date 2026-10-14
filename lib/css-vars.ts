import type { CSSProperties } from "react";

/** Custom properties for an inline style. React's CSSProperties has no index signature for "--name", so the one cast lives here. */
export function cssVars(vars: Record<`--${string}`, string>): CSSProperties {
  return vars as CSSProperties;
}
