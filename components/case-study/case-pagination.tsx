import Link from "next/link";
import type { CaseStudy } from "@/content/schema";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import styles from "./case-pagination.module.css";

type CasePaginationProps = { previous: CaseStudy; next: CaseStudy };

/** Previous / next case study in content order (wrapping), then the spec §7.3 "All work" secondary button. */
export function CasePagination({ previous, next }: CasePaginationProps) {
  return (
    <section aria-label="More case studies" className={styles.band} data-surface="light">
      <div className="container">
        <nav aria-label="Case studies" className={styles.pager}>
          <Link className={`${styles.link} ${styles.previous}`} href={`/work/${previous.slug}`} rel="prev">
            <span className={`t-mono-label ${styles.label}`}>
              <Icon className={styles.iconPrevious} name="arrow-left" />Previous project
            </span>
            <span className={`t-h4 ${styles.title}`}>{previous.title}</span>
          </Link>
          <Link className={`${styles.link} ${styles.next}`} href={`/work/${next.slug}`} rel="next">
            <span className={`t-mono-label ${styles.label}`}>
              Next project<Icon className={styles.iconNext} name="arrow-right" />
            </span>
            <span className={`t-h4 ${styles.title}`}>{next.title}</span>
          </Link>
        </nav>
        <div className={styles.back}>
          <Button className={styles.backButton} href="/#work" size="md" variant="secondary">
            <Icon className={`button-icon ${styles.iconBack}`} name="arrow-left" />
            <span>All work</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
