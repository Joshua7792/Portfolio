/** Spec §8 motion values. app/globals.css mirrors the shared durations as --duration-* tokens. */
export const motion = {
  duration: {
    press: "120ms",
    hover: "160ms",
    underline: "200ms",
    fade: "200ms", // reduced-motion entrance fade (spec §8, reduced-motion row)
    entrance: "400ms",
    reveal: "500ms",
    hero: "600ms",
    menuOpen: "240ms", // spec §8 row 15, panel
    menuItem: "200ms", // spec §8 row 15, links
    menuClose: "160ms", // spec §8 row 16, and the reduced-motion menu fade
  },
  /** Numeric twins for timers (ms). */
  ms: {
    menuClose: 160, // spec §8 row 16
  },
  delay: {
    menuItem: 80, // ms, spec §8 row 15: links start at 80
    menuItemStep: 40, // ms, then +40 each
    staggerStep: 60, // ms, spec §8 row 14: 60 per sibling
    staggerMaxSteps: 5, // capped at the 6th sibling (5 x 60 = 300ms)
  },
  easing: {
    outStrong: "cubic-bezier(0.23, 1, 0.32, 1)",
    inOutStrong: "cubic-bezier(0.77, 0, 0.175, 1)",
    standard: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  },
} as const;
