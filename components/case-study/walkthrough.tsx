"use client";

import { useState } from "react";
import { CaseMedia } from "./case-media";
import styles from "./walkthrough.module.css";

type WalkthroughProps = { gif: string; poster: string; sizes: string; className?: string };

/**
 * WCAG 2.2.2 ruling (Phase 3, R-3 B-1; spec §14.7 amended): a walkthrough GIF never moves on its own. A still poster
 * shows first, and the reader starts or stops the loop with a 44px button. Starting paused for everyone also honours
 * prefers-reduced-motion; an explicit press still plays it. The figure's caption describes the content, so the image
 * alt is empty and the button names the action.
 */
export function Walkthrough({ gif, poster, sizes, className = "" }: WalkthroughProps) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className={`${styles.wrap} ${className}`.trim()}>
      <CaseMedia alt="" available sizes={sizes} src={playing ? gif : poster} unoptimized />
      <button className={`button button-primary t-btn-sm ${styles.toggle}`} onClick={() => setPlaying((value) => !value)} type="button">
        {playing ? "Pause walkthrough" : "Play walkthrough"}
      </button>
    </div>
  );
}
