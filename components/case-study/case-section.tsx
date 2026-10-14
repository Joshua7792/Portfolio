import type { ReactNode } from "react";
import styles from "./case-section.module.css";

type CaseSectionProps = {
  id: string;
  heading: string;
  /** Prose beside the heading (cols 5-11 at 1440). */
  intro?: ReactNode;
  /** Full-width content under the heading row (diagram, gallery, stat tiles). */
  children?: ReactNode;
};

/** Spec §7.3 body section: border-top rule, pad 96/96, h2c cols 1-4, prose cols 5-11 (640 max), then a 48 gap to full-width content. */
export function CaseSection({ id, heading, intro, children }: CaseSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className={styles.section} data-surface="light" id={id}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.row}>
          <h2 className={`t-h2c ${styles.heading}`} id={headingId}>{heading}</h2>
          {intro && <div className={styles.prose}>{intro}</div>}
        </div>
        {children && <div className={styles.body}>{children}</div>}
      </div>
    </section>
  );
}
