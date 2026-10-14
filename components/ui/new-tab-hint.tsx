/** Visually hidden cue for links that open a new tab (r3 N-5, WCAG G201). Screen readers announce it with the link name. */
export function NewTabHint() {
  return <span className="sr-only"> (opens in new tab)</span>;
}
